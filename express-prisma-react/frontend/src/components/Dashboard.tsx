import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MY_TASKS,
  GET_ME,
  CREATE_TASK_MUTATION,
  UPDATE_TASK_MUTATION,
  DELETE_TASK_MUTATION,
  TOGGLE_TASK_MUTATION,
} from "../apollo/queries";
import "./Dashboard.css";

interface DashboardProps {
  onLogout: () => void;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Queries
  const { data: userData } = useQuery(GET_ME);
  const { data: tasksData, loading, refetch } = useQuery(GET_MY_TASKS);

  // Mutations
  const [createTask] = useMutation(CREATE_TASK_MUTATION, {
    onCompleted: () => {
      setNewTask({ title: "", description: "" });
      refetch();
    },
  });

  const [updateTask] = useMutation(UPDATE_TASK_MUTATION, {
    onCompleted: () => {
      setEditingTask(null);
      refetch();
    },
  });

  const [deleteTask] = useMutation(DELETE_TASK_MUTATION, {
    onCompleted: refetch,
  });

  const [toggleTask] = useMutation(TOGGLE_TASK_MUTATION, {
    onCompleted: refetch,
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await createTask({
        variables: {
          input: {
            title: newTask.title,
            description: newTask.description || undefined,
          },
        },
      });
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      await updateTask({
        variables: {
          id: editingTask.id,
          input: {
            title: editingTask.title,
            description: editingTask.description || undefined,
          },
        },
      });
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask({ variables: { id } });
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      await toggleTask({ variables: { id } });
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const tasks: Task[] = tasksData?.myTasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Welcome, {userData?.me?.name}! 👋</h1>
            <p className="header-subtitle">{userData?.me?.email}</p>
          </div>
          <button onClick={onLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{tasks.length - completedCount}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="create-task-card">
          <h2>Create New Task</h2>
          <form onSubmit={handleCreateTask} className="task-form">
            <input
              type="text"
              placeholder="Task title..."
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              className="input"
              required
            />
            <textarea
              placeholder="Description (optional)..."
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              className="textarea"
              rows={3}
            />
            <button type="submit" className="btn-primary">
              Add Task
            </button>
          </form>
        </div>

        <div className="tasks-section">
          <h2>My Tasks</h2>
          {loading ? (
            <p className="loading">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="empty-state">No tasks yet. Create one above!</p>
          ) : (
            <div className="tasks-grid">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-card ${task.completed ? "completed" : ""}`}
                >
                  {editingTask?.id === task.id ? (
                    <form onSubmit={handleUpdateTask} className="edit-form">
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            title: e.target.value,
                          })
                        }
                        className="input"
                        required
                      />
                      <textarea
                        value={editingTask.description || ""}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            description: e.target.value,
                          })
                        }
                        className="textarea"
                        rows={2}
                      />
                      <div className="edit-actions">
                        <button type="submit" className="btn-save">
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTask(null)}
                          className="btn-cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="task-content">
                        <div className="task-header">
                          <h3>{task.title}</h3>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task.id)}
                            className="checkbox"
                          />
                        </div>
                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}
                        <p className="task-date">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="task-actions">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="btn-edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

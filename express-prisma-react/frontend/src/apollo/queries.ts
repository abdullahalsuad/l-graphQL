import { gql } from "@apollo/client";

// ============================================
// AUTHENTICATION MUTATIONS
// ============================================

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

// ============================================
// USER QUERIES
// ============================================

export const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
      createdAt
    }
  }
`;

// ============================================
// TASK QUERIES
// ============================================

export const GET_MY_TASKS = gql`
  query GetMyTasks {
    myTasks {
      id
      title
      description
      completed
      createdAt
      updatedAt
    }
  }
`;

export const GET_TASKS_PAGINATED = gql`
  query GetTasksPaginated($first: Int, $after: String) {
    tasksCursor(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          description
          completed
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

// ============================================
// TASK MUTATIONS
// ============================================

export const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      description
      completed
      createdAt
    }
  }
`;

export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      title
      description
      completed
      updatedAt
    }
  }
`;

export const DELETE_TASK_MUTATION = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      id
    }
  }
`;

export const TOGGLE_TASK_MUTATION = gql`
  mutation ToggleTask($id: ID!) {
    toggleTaskComplete(id: $id) {
      id
      completed
    }
  }
`;

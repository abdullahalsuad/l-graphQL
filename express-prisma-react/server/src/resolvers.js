import prisma from "./db.js";
import { hashPassword, comparePassword, generateToken } from "./utils/auth.js";
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "./utils/errors.js";

// ============================================
// HELPER FUNCTIONS
// ============================================

// Check if user is authenticated
const requireAuth = (context) => {
  if (!context.user) {
    throw new AuthenticationError(
      "You must be logged in to perform this action"
    );
  }
  return context.user;
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ============================================
// RESOLVERS
// ============================================

export const resolvers = {
  // ==================== QUERIES ====================
  Query: {
    // Basic examples
    hello: () => "Hello from GraphQL!",
    welcomeMessage: (_, { name }) => `Welcome to GraphQL, ${name}!`,

    // Get current user (requires authentication)
    me: async (_, __, context) => {
      const user = requireAuth(context);
      return await prisma.user.findUnique({
        where: { id: user.id },
        include: { tasks: true },
      });
    },

    // Get user by ID
    user: async (_, { id }) => {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { tasks: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return user;
    },

    // Get all users
    users: async () => {
      return await prisma.user.findMany({
        include: { tasks: true },
      });
    },

    // Get single task
    task: async (_, { id }, context) => {
      const task = await prisma.task.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!task) {
        throw new NotFoundError("Task not found");
      }

      return task;
    },

    // Get current user's tasks
    myTasks: async (_, __, context) => {
      const user = requireAuth(context);

      return await prisma.task.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: { user: true },
      });
    },

    // Offset-based pagination (Topic 11)
    tasksOffset: async (_, { limit = 10, offset = 0 }, context) => {
      const user = requireAuth(context);

      return await prisma.task.findMany({
        where: { userId: user.id },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      });
    },

    // Cursor-based pagination (Topic 11 - Recommended)
    tasksCursor: async (_, { first = 10, after, userId }, context) => {
      const currentUser = requireAuth(context);

      // Use userId if provided, otherwise use current user
      const targetUserId = userId || currentUser.id;

      // Build where clause
      const where = { userId: targetUserId };

      // Get total count
      const totalCount = await prisma.task.count({ where });

      // Build cursor query
      const tasks = await prisma.task.findMany({
        where,
        take: first + 1, // Get one extra to check if there's a next page
        ...(after && {
          cursor: { id: after },
          skip: 1, // Skip the cursor
        }),
        orderBy: { createdAt: "desc" },
        include: { user: true },
      });

      const hasNextPage = tasks.length > first;
      const edges = tasks.slice(0, first).map((task) => ({
        cursor: task.id,
        node: task,
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount,
      };
    },
  },

  // ==================== MUTATIONS ====================
  Mutation: {
    // REGISTER (Topic 12 - Authentication)
    register: async (_, { input }) => {
      const { name, email, password } = input;

      // Validation
      if (!name || name.trim().length < 2) {
        throw new ValidationError("Name must be at least 2 characters");
      }

      if (!isValidEmail(email)) {
        throw new ValidationError("Invalid email format");
      }

      if (password.length < 6) {
        throw new ValidationError("Password must be at least 6 characters");
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ValidationError("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Generate token
      const token = generateToken(user.id);

      return { token, user };
    },

    // LOGIN (Topic 12 - Authentication)
    login: async (_, { input }) => {
      const { email, password } = input;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AuthenticationError("Invalid credentials");
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.password);

      if (!isValidPassword) {
        throw new AuthenticationError("Invalid credentials");
      }

      // Generate token
      const token = generateToken(user.id);

      return { token, user };
    },

    // CREATE TASK (Topic 13 - Authorization)
    createTask: async (_, { input }, context) => {
      const user = requireAuth(context);
      const { title, description } = input;

      if (!title || title.trim().length < 3) {
        throw new ValidationError("Title must be at least 3 characters");
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          userId: user.id,
        },
        include: { user: true },
      });

      return task;
    },

    // UPDATE TASK (Topic 13 - Authorization)
    updateTask: async (_, { id, input }, context) => {
      const user = requireAuth(context);

      // Check if task exists and belongs to user
      const existingTask = await prisma.task.findUnique({
        where: { id },
      });

      if (!existingTask) {
        throw new NotFoundError("Task not found");
      }

      if (existingTask.userId !== user.id) {
        throw new ForbiddenError("You can only update your own tasks");
      }

      // Update task
      const task = await prisma.task.update({
        where: { id },
        data: input,
        include: { user: true },
      });

      return task;
    },

    // DELETE TASK (Topic 13 - Authorization)
    deleteTask: async (_, { id }, context) => {
      const user = requireAuth(context);

      // Check if task exists and belongs to user
      const existingTask = await prisma.task.findUnique({
        where: { id },
      });

      if (!existingTask) {
        throw new NotFoundError("Task not found");
      }

      if (existingTask.userId !== user.id) {
        throw new ForbiddenError("You can only delete your own tasks");
      }

      // Delete task
      const task = await prisma.task.delete({
        where: { id },
        include: { user: true },
      });

      return task;
    },

    // TOGGLE TASK COMPLETE
    toggleTaskComplete: async (_, { id }, context) => {
      const user = requireAuth(context);

      const existingTask = await prisma.task.findUnique({
        where: { id },
      });

      if (!existingTask) {
        throw new NotFoundError("Task not found");
      }

      if (existingTask.userId !== user.id) {
        throw new ForbiddenError("You can only update your own tasks");
      }

      const task = await prisma.task.update({
        where: { id },
        data: { completed: !existingTask.completed },
        include: { user: true },
      });

      return task;
    },
  },

  // ==================== FIELD RESOLVERS ====================
  // These resolve relationships (Topic 10)

  User: {
    // When a User type is returned, this resolver fetches their tasks
    // This helps avoid the N+1 problem with proper data loading
    tasks: async (parent) => {
      return await prisma.task.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: "desc" },
      });
    },
  },

  Task: {
    // When a Task type is returned, this resolver fetches the user
    user: async (parent) => {
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
  },
};

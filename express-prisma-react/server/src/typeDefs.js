export const typeDefs = `#graphql
  # ============================================
  # SCALARS & CUSTOM TYPES
  # ============================================
  # Scalar types are the primitive types in GraphQL
  # Built-in: String, Int, Float, Boolean, ID
  # Custom scalars can be added (e.g., DateTime, JSON)

  # ============================================
  # USER TYPE
  # ============================================
  type User {
    id: ID!              # Non-null ID
    name: String!        # Non-null String
    email: String!
    createdAt: String!
    tasks: [Task!]!      # Array of non-null Tasks (can be empty array)
  }

  # ============================================
  # TASK TYPE
  # ============================================
  type Task {
    id: ID!
    title: String!
    description: String  # Nullable field
    completed: Boolean!
    createdAt: String!
    updatedAt: String!
    user: User!          # Each task belongs to a user
  }

  # ============================================
  # AUTHENTICATION RESPONSE
  # ============================================
  type AuthPayload {
    token: String!
    user: User!
  }

  # ============================================
  # PAGINATION TYPES
  # ============================================
  # Cursor-based pagination (recommended for production)
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type TaskEdge {
    cursor: String!
    node: Task!
  }

  type TaskConnection {
    edges: [TaskEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  # ============================================
  # INPUT TYPES
  # ============================================
  # Input types are used for complex arguments in mutations
  # WHY? They make mutations cleaner and reusable

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateTaskInput {
    title: String!
    description: String
  }

  input UpdateTaskInput {
    title: String
    description: String
    completed: Boolean
  }

  # ============================================
  # QUERIES
  # ============================================
  # Queries are READ operations (like GET in REST)
  
  type Query {
    # Basic queries (Topic 2)
    hello: String
    welcomeMessage(name: String): String

    # User queries
    me: User                              # Get current authenticated user
    user(id: ID!): User                   # Get user by ID
    users: [User!]!                       # Get all users

    # Task queries
    task(id: ID!): Task                   # Get single task
    myTasks: [Task!]!                     # Get tasks for current user
    
    # Pagination (Topic 11)
    # Offset-based (simple but not recommended for large datasets)
    tasksOffset(limit: Int, offset: Int): [Task!]!
    
    # Cursor-based (recommended for production)
    tasksCursor(
      first: Int
      after: String
      userId: ID
    ): TaskConnection!
  }

  # ============================================
  # MUTATIONS
  # ============================================
  # Mutations are WRITE operations (like POST, PUT, DELETE in REST)
  # They execute sequentially (not in parallel like queries)
  
  type Mutation {
    # Authentication (Topics 12-13)
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Task mutations (require authentication)
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Task!
    toggleTaskComplete(id: ID!): Task!
  }
`;

# 📚 GraphQL Learning Notes - Complete Guide

## Table of Contents

1. [GraphQL vs REST](#1-graphql-vs-rest)
2. [GraphQL Query](#2-graphql-query)
3. [GraphQL Mutation](#3-graphql-mutation)
4. [Schema & Type Definitions](#4-schema--type-definitions)
5. [Scalars & Custom Types](#5-scalars--custom-types)
6. [Arguments](#6-arguments)
7. [Resolver Basics](#7-resolver-basics)
8. [GraphQL Playground](#8-graphql-playground)
9. [Input Types](#9-input-types)
10. [User-Task Relationships](#10-user-task-relationships)
11. [Pagination](#11-pagination)
12. [Authentication (JWT)](#12-authentication-jwt)
13. [Authorization](#13-authorization)
14. [Error Handling](#14-error-handling)
15. [Context Usage](#15-context-usage)
16. [Environment Variables](#16-environment-variables)
17. [N+1 Problem](#17-n1-problem)
18. [Schema Design Best Practices](#18-schema-design-best-practices)
19. [Frontend Queries & Mutations](#19-frontend-queries--mutations)
20. [Apollo Client Cache](#20-apollo-client-cache)

---

## 1. GraphQL vs REST

### What is it?

GraphQL is a **query language for APIs** and a **runtime for executing those queries**. It was created by Facebook in 2012 and open-sourced in 2015.

### Why is it needed?

REST APIs have fundamental limitations:

**Problem 1: Over-fetching**

```
REST: GET /users/1
Returns: { id, name, email, address, phone, bio, avatar, ... }
You wanted: Just the name
You got: 10+ extra fields (wasted bandwidth)
```

**Problem 2: Under-fetching**

```
To display a user's profile with their posts:
REST requires:
  1. GET /users/1          (get user)
  2. GET /users/1/posts    (get posts)
  3. GET /posts/1/comments (get comments for each post)

Result: Multiple round trips, slow performance
```

**Problem 3: Fixed Endpoints**

- Adding new features often requires new endpoints
- Frontend and backend become tightly coupled
- API versioning becomes messy (/api/v1, /api/v2)

### How GraphQL Solves This

```graphql
# Single request:
query {
  user(id: "1") {
    name
    posts {
      title
      comments {
        text
      }
    }
  }
}

# You get EXACTLY what you asked for, in ONE request
```

### Common Mistakes

❌ Thinking GraphQL replaces databases (it doesn't, it's an API layer)  
❌ Using GraphQL for everything (REST is still good for simple CRUD)  
❌ Not setting query depth limits (clients could request infinite nesting)

### Best Practices

✅ Use GraphQL for complex, nested data requirements  
✅ Implement query depth limiting  
✅ Use DataLoader to prevent N+1 queries  
✅ Design your schema carefully (it's your API contract)

---

## 2. GraphQL Query

### What is it?

A **Query** is how you **READ data** from a GraphQL API. It's equivalent to GET in REST.

### Why is it needed?

In GraphQL, everything is explicit. You must define what you want to fetch.

### How it works?

**Schema Definition:**

```graphql
type Query {
  hello: String
  user(id: ID!): User
}
```

**Resolver:**

```javascript
Query: {
  hello: () => "Hello World!",
  user: (_, { id }) => getUserById(id)
}
```

**Client Request:**

```graphql
query {
  hello
}
```

**Response:**

```json
{
  "data": {
    "hello": "Hello World!"
  }
}
```

### How we use it in this project

```javascript
// In typeDefs.js
type Query {
  me: User
  myTasks: [Task!]!
  task(id: ID!): Task
}

// In resolvers.js
Query: {
  myTasks: async (_, __, context) => {
    const user = requireAuth(context);
    return await prisma.task.findMany({
      where: { userId: user.id }
    });
  }
}
```

### Common Mistakes

❌ Not naming your queries (harder to debug)  
❌ Requesting too many fields (impacts performance)  
❌ Forgetting to handle null cases

### Best Practices

✅ Always name your queries: `query GetMyTasks { ... }`  
✅ Use fragments to reuse field selections  
✅ Request only what you need

---

## 3. GraphQL Mutation

### What is it?

A **Mutation** is how you **WRITE data** (Create, Update, Delete). It's equivalent to POST, PUT, DELETE in REST.

### Why is it needed?

Applications need to modify data, not just read it.

### How it works?

**Key Difference from Queries:**

- Queries can run in parallel (safe, read-only)
- **Mutations run sequentially** (prevents race conditions)

**Example:**

```graphql
type Mutation {
  createTask(title: String!): Task
}
```

**Resolver:**

```javascript
Mutation: {
  createTask: async (_, { title }, context) => {
    const user = requireAuth(context);
    return await prisma.task.create({
      data: { title, userId: user.id },
    });
  };
}
```

**Client Request:**

```graphql
mutation {
  createTask(title: "Learn GraphQL") {
    id
    title
    completed
  }
}
```

### How we use it in this project

```javascript
Mutation: {
  register: async (_, { input }) => {
    const hashedPassword = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: { ...input, password: hashedPassword },
    });
    const token = generateToken(user.id);
    return { token, user };
  };
}
```

### Common Mistakes

❌ Using queries for mutations (breaks conventions)  
❌ Not returning the created/updated object  
❌ Forgetting to validate input

### Best Practices

✅ Always validate input before processing  
✅ Return the modified object for client cache updates  
✅ Use Input Types for complex arguments

---

## 4. Schema & Type Definitions

### What is it?

The **Schema** is the **contract** between your frontend and backend. It defines:

- What data can be queried
- What data can be mutated
- The shape of that data

### Why is it needed?

- **Type Safety:** Prevents runtime errors
- **Self-Documentation:** Clients know exactly what's available
- **Validation:** Invalid queries are rejected before execution

### How it works?

Schema Definition Language (SDL):

```graphql
type User {
  id: ID! # Exclamation mark = required (non-nullable)
  name: String!
  email: String!
  age: Int
  tasks: [Task!]! # Array of Tasks (array cannot be null, items cannot be null)
}

type Query {
  users: [User!]!
}
```

### How we use it in this project

```javascript
// typeDefs.js
export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
    tasks: [Task!]!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    completed: Boolean!
    user: User!
  }

  type Query {
    me: User
  }
`;
```

### Common Mistakes

❌ Making everything nullable (loses type safety benefits)  
❌ Not using `!` appropriately  
❌ Overly complex nested types

### Best Practices

✅ Make fields non-null by default, nullable only when necessary  
✅ Use descriptive type names  
✅ Keep types focused (Single Responsibility)

---

## 5. Scalars & Custom Types

### What is it?

**Scalars** are the **primitive types** in GraphQL.

**Built-in Scalars:**

- `String` - UTF-8 text
- `Int` - 32-bit integer
- `Float` - Floating point number
- `Boolean` - true/false
- `ID` - Unique identifier (serialized as String)

**Custom Scalars:**
You can create your own (e.g., `DateTime`, `Email`, `URL`).

### Why is it needed?

Built-in scalars cover most cases, but custom scalars provide:

- Better validation
- Proper serialization
- Type safety

### How it works?

**Using Built-ins:**

```graphql
type User {
  id: ID!
  name: String!
  age: Int
  rating: Float
  isActive: Boolean!
}
```

**Custom Scalar Example:**

```graphql
scalar DateTime

type Task {
  createdAt: DateTime!
}
```

### How we use it in this project

We use built-in scalars + serialize dates as Strings:

```graphql
type Task {
  id: ID!
  title: String!
  completed: Boolean!
  createdAt: String! # ISO 8601 format
}
```

### Common Mistakes

❌ Using `String` for everything  
❌ Not validating ID formats  
❌ Confusing `ID` with `Int`

### Best Practices

✅ Use `ID` for unique identifiers  
✅ Use `Int` for counts, quantities  
✅ Use `Float` for prices, ratings  
✅ Consider custom scalars for dates, emails, URLs

---

## 6. Arguments

### What is it?

**Arguments** are **parameters** passed to queries or mutations to filter, sort, or provide input.

### Why is it needed?

To make queries flexible and reusable.

### How it works?

**Schema:**

```graphql
type Query {
  user(id: ID!): User
  tasks(completed: Boolean, limit: Int): [Task!]!
}
```

**Resolver:**

```javascript
Query: {
  user: (parent, args, context) => {
    return getUserById(args.id);
  },
  tasks: (_, { completed, limit }) => {
    return getTasks({ completed, limit });
  }
}
```

**Client Request:**

```graphql
query {
  tasks(completed: false, limit: 5) {
    title
  }
}
```

### How we use it in this project

```javascript
// Schema
type Query {
  task(id: ID!): Task
  tasksCursor(first: Int, after: String): TaskConnection!
}

// Resolver
task: async (_, { id }) => {
  return await prisma.task.findUnique({ where: { id } });
}
```

### Common Mistakes

❌ Too many arguments (use Input Types instead)  
❌ Not providing defaults  
❌ Forgetting to validate arguments

### Best Practices

✅ Use Input Types for 3+ arguments  
✅ Provide sensible defaults  
✅ Validate all input

---

## 7. Resolver Basics

### What is it?

**Resolvers** are **functions that fetch data** for each field in your schema.

### Why is it needed?

The schema defines WHAT can be queried. Resolvers define HOW to get that data.

### How it works?

**Resolver Function Signature:**

```javascript
fieldName: (parent, args, context, info) => {
  // Return data
};
```

**Parameters:**

- `parent` - Result from parent resolver
- `args` - Arguments passed to the field
- `context` - Shared data (auth user, database connection)
- `info` - Query metadata (rarely used)

**Example:**

```javascript
const resolvers = {
  Query: {
    hello: () => "Hello World!",
    user: (_, { id }) => getUserById(id),
  },
  User: {
    tasks: (parent) => getTasksByUserId(parent.id),
  },
};
```

### How we use it in this project

```javascript
export const resolvers = {
  Query: {
    me: async (_, __, context) => {
      const user = requireAuth(context);
      return await prisma.user.findUnique({
        where: { id: user.id },
      });
    },
  },

  Mutation: {
    createTask: async (_, { input }, context) => {
      const user = requireAuth(context);
      return await prisma.task.create({
        data: { ...input, userId: user.id },
      });
    },
  },

  User: {
    tasks: async (parent) => {
      return await prisma.task.findMany({
        where: { userId: parent.id },
      });
    },
  },
};
```

### Common Mistakes

❌ Doing heavy computation in resolvers (use services)  
❌ Not handling errors  
❌ Causing N+1 queries

### Best Practices

✅ Keep resolvers thin (delegate to service layer)  
✅ Use async/await  
✅ Handle errors gracefully

---

## 8. GraphQL Playground

### What is it?

An **interactive GraphQL IDE** to test queries and explore your schema.

### Why is it needed?

- Test API without writing frontend code
- Explore auto-generated documentation
- Debug queries

### How it works?

Visit `http://localhost:4000/graphql` in your browser.

**Features:**

- Auto-completion
- Documentation explorer
- Query history
- HTTP header management

### How we use it in this project

**Testing Authentication:**

```graphql
# Step 1: Register
mutation {
  register(input: {
    name: "Test User"
    email: "test@example.com"
    password: "password123"
  }) {
    token
    user { name }
  }
}

# Step 2: Copy the token

# Step 3: Set HTTP Headers (bottom left):
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}

# Step 4: Test authenticated query
query {
  myTasks {
    title
  }
}
```

### Common Mistakes

❌ Not setting authentication headers  
❌ Forgetting to save queries  
❌ Not using query variables

### Best Practices

✅ Use query variables for dynamic values  
✅ Save frequently used queries  
✅ Use the Documentation Explorer

---

## 9. Input Types

### What is it?

**Input Types** are special types used exclusively for **mutation arguments**.

### Why is it needed?

**Without Input Types:**

```graphql
# Hard to read, maintain
createUser(name: String!, email: String!, password: String!, age: Int): User
```

**With Input Types:**

```graphql
# Clean and reusable
createUser(input: CreateUserInput!): User

input CreateUserInput {
  name: String!
  email: String!
  password: String!
  age: Int
}
```

### How it works?

**Define Input Type:**

```graphql
input CreateTaskInput {
  title: String!
  description: String
}

type Mutation {
  createTask(input: CreateTaskInput!): Task!
}
```

**Resolver:**

```javascript
Mutation: {
  createTask: (_, { input }) => {
    const { title, description } = input;
    return createTask({ title, description });
  };
}
```

### How we use it in this project

```graphql
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

type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  createTask(input: CreateTaskInput!): Task!
  updateTask(id: ID!, input: UpdateTaskInput!): Task!
}
```

### Common Mistakes

❌ Using Output Types as Input Types (not allowed)  
❌ Making all fields required  
❌ Not validating input in resolvers

### Best Practices

✅ Use Input Types for 2+ arguments  
✅ Make update inputs optional (partial updates)  
✅ Validate input in resolvers

---

## 10. User-Task Relationships

### What is it?

Defining **relationships between types** in your GraphQL schema and database.

### Why is it needed?

Real-world data is relational. Users have Tasks, Posts have Comments, etc.

### How it works with Prisma?

**Database Schema (Prisma):**

```prisma
model User {
  id    String @id @default(uuid())
  name  String
  tasks Task[]  // One-to-Many
}

model Task {
  id     String @id @default(uuid())
  title  String
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
```

**GraphQL Schema:**

```graphql
type User {
  id: ID!
  name: String!
  tasks: [Task!]!
}

type Task {
  id: ID!
  title: String!
  user: User!
}
```

**Resolvers:**

```javascript
User: {
  tasks: async (parent) => {
    return await prisma.task.findMany({
      where: { userId: parent.id }
    });
  }
},

Task: {
  user: async (parent) => {
    return await prisma.user.findUnique({
      where: { id: parent.userId }
    });
  }
}
```

### How we use it in this project

```javascript
// One User can have many Tasks
// Each Task belongs to one User

// Query example:
query {
  me {
    name
    tasks {
      title
      completed
    }
  }
}
```

### Common Mistakes

❌ Forgetting foreign keys in database  
❌ Causing N+1 queries (Query all users, then tasks for each)  
❌ Not using `include` in Prisma

### Best Get more content...

---

**(Continued in next part due to length...)**

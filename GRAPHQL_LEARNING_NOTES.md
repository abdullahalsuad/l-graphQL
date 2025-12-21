# GraphQL Learning Notes - Beginner to Advanced

## Table of Contents

1. [Introduction](#1-introduction)
2. [Core Concepts](#2-core-concepts)
3. [How GraphQL Works](#3-how-graphql-works)
4. [Schema Definition Language (SDL)](#4-schema-definition-language-sdl)
5. [Resolvers](#5-resolvers)
6. [Queries, Mutations, Subscriptions](#6-queries-mutations-subscriptions)
7. [Arguments & Variables](#7-arguments--variables)
8. [Context & Authentication](#8-context--authentication)
9. [Error Handling](#9-error-handling)
10. [Performance & Scaling](#10-performance--scaling)
11. [Best Practices](#11-best-practices)
12. [GraphQL Cheat Sheet](#12-graphql-cheat-sheet)
13. [Setup Guides](#13-setup-guides)

---

## 1. Introduction

### What is GraphQL?

GraphQL is a **query language for APIs** and a **runtime for executing queries**. Created by Facebook in 2012, open-sourced in 2015.

**Key Properties:**

- **Strongly typed** - Schema defines the API contract
- **Client-driven** - Clients specify exactly what they need
- **Single endpoint** - Typically `/graphql`
- **Introspective** - Schema is self-documenting

### Why GraphQL Exists

**REST API Problems:**

1. **Over-fetching** - Getting unnecessary data wastes bandwidth
2. **Under-fetching** - Multiple requests needed for related data
3. **Rigid structure** - Backend defines response shape
4. **Versioning complexity** - /api/v1, /api/v2 proliferation

**GraphQL Solutions:**

- Request exactly what you need
- Get multiple resources in a single request
- Schema evolution without versioning
- Strong typing prevents errors

### When NOT to Use GraphQL

❌ **Avoid GraphQL if:**

- Simple CRUD with standard REST patterns works fine
- File uploads are primary use case (use REST)
- Caching with HTTP is critical (GraphQL caching is complex)
- Team lacks GraphQL expertise and time to learn
- Public API where clients can abuse complex queries

✅ **Use GraphQL when:**

- Complex, nested data relationships
- Multiple client types (web, mobile) with different needs
- Rapid frontend iteration required
- Strong typing benefits outweigh complexity

---

## 2. Core Concepts

### Schema

The **contract** between client and server. Defines:

- Available operations (queries, mutations, subscriptions)
- Data types and their relationships
- Required vs optional fields

```graphql
type User {
  id: ID!
  name: String!
  email: String!
}

type Query {
  user(id: ID!): User
}
```

### Type

Types define the **shape of data**:

- **Object Types** - Custom types like `User`, `Post`
- **Scalar Types** - Primitives like `String`, `Int`, `Boolean`
- **Input Types** - For mutation arguments
- **Enum Types** - Fixed set of values

### Query

**Read operations** - fetching data without side effects.

```graphql
query GetUser {
  user(id: "1") {
    name
    email
  }
}
```

### Mutation

**Write operations** - creating, updating, deleting data.

```graphql
mutation CreateUser {
  createUser(input: { name: "John", email: "john@example.com" }) {
    id
    name
  }
}
```

### Resolver

Functions that **fetch data** for each field.

```javascript
const resolvers = {
  Query: {
    user: (parent, args, context) => getUserById(args.id),
  },
};
```

**Parameters:**

- `parent` - Result from parent resolver
- `args` - Field arguments
- `context` - Shared data (auth, db connections)
- `info` - Query AST metadata (rarely used)

### Context

Shared object available to **all resolvers**. Typically contains:

- Authenticated user
- Database connections
- DataLoaders
- Request headers

```javascript
const context = ({ req }) => ({
  user: getUserFromToken(req.headers.authorization),
  prisma: prismaClient,
});
```

### Scalar vs Object Types

**Scalars** - Primitive values:

- `String`, `Int`, `Float`, `Boolean`, `ID`
- Custom: `DateTime`, `Email`, `URL`

**Objects** - Composite types:

```graphql
type User {
  id: ID! # Scalar
  name: String! # Scalar
  posts: [Post!]! # Object type array
}
```

---

## 3. How GraphQL Works

### Request Flow

```
Client → GraphQL Server → Resolvers → Services → Database
         ↓
    Parse Query
         ↓
    Validate Schema
         ↓
    Execute Resolvers
         ↓
    Format Response → Client
```

### Detailed Steps

1. **Parse** - Convert query string to AST (Abstract Syntax Tree)
2. **Validate** - Check against schema (type safety)
3. **Execute** - Run resolvers for requested fields
4. **Format** - Return JSON response

### Resolver vs Controller (REST Comparison)

**REST Controller:**

```javascript
// Single endpoint handles entire resource
app.get("/users/:id", (req, res) => {
  const user = getUserById(req.params.id);
  const posts = getPostsByUserId(user.id);
  res.json({ user, posts });
});
```

**GraphQL Resolver:**

```javascript
// Each field has its own resolver
const resolvers = {
  Query: {
    user: (_, { id }) => getUserById(id),
  },
  User: {
    // Only called if client requests posts
    posts: (parent) => getPostsByUserId(parent.id),
  },
};
```

**Key Difference:** GraphQL resolvers are **field-level**, REST controllers are **endpoint-level**.

### Single Endpoint Concept

**REST:**

```
GET /users
GET /users/:id
POST /users
PUT /users/:id
DELETE /users/:id
GET /users/:id/posts
```

**GraphQL:**

```
POST /graphql  (all operations)
```

**Benefits:**

- Simplified routing
- Easier API gateway integration
- Consistent error handling
- Single authentication point

**Tradeoffs:**

- HTTP caching harder
- Monitoring requires query parsing
- Cannot use HTTP methods for semantic meaning

---

## 4. Schema Definition Language (SDL)

### Basic Types

```graphql
type User {
  id: ID!
  name: String!
  age: Int
  rating: Float
  isActive: Boolean!
}
```

### Non-null Types (!)

```graphql
type User {
  id: ID! # Required - cannot be null
  name: String! # Required
  bio: String # Optional - can be null
}
```

**Arrays with Non-null:**

```graphql
type User {
  tags: [String!]!
  # ↑ Array cannot be null
  #         ↑ Items cannot be null
  # Valid: [], ["tag1"]
  # Invalid: null, ["tag1", null]

  friends: [User!]
  # Valid: null, [], [user1]
  # Invalid: [user1, null]

  posts: [Post]
  # Everything nullable
}
```

### Lists

```graphql
type User {
  posts: [Post!]!
  tags: [String]
}

type Query {
  users(ids: [ID!]!): [User!]!
}
```

### Input Types

Used for **mutation arguments** only.

```graphql
input CreateUserInput {
  name: String!
  email: String!
  age: Int
}

input UpdateUserInput {
  name: String # All optional for partial updates
  email: String
  age: Int
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}
```

**Cannot use:**

- Object types as input
- Interfaces in input types

### Enums

Fixed set of values providing **type safety**.

```graphql
enum Role {
  ADMIN
  USER
  GUEST
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

type User {
  role: Role!
}

type Query {
  tasks(status: TaskStatus): [Task!]!
}
```

**Usage:**

```graphql
query {
  tasks(status: IN_PROGRESS) {
    title
  }
}
```

---

## 5. Resolvers

### Resolver Signature

```javascript
fieldName: (parent, args, context, info) => {
  return value;
};
```

**Parameters Explained:**

```javascript
const resolvers = {
  Query: {
    user: (parent, args, context, info) => {
      // parent: undefined for root queries
      // args: { id: "123" }
      // context: { user: {...}, prisma: {...} }
      // info: Query AST (rarely needed)
      return getUserById(args.id);
    },
  },

  User: {
    posts: (parent, args, context, info) => {
      // parent: User object from Query.user
      // Can access parent.id, parent.name, etc.
      return getPostsByUserId(parent.id);
    },
  },
};
```

### Field-level Resolvers

You only need field resolvers when:

1. Field requires **custom logic**
2. Field is a **relationship**
3. Field needs **data transformation**

```graphql
type User {
  id: ID!
  firstName: String!
  lastName: String!
  fullName: String! # Computed field
  posts: [Post!]! # Relationship
}
```

```javascript
const resolvers = {
  User: {
    // firstName, lastName auto-resolved

    // Custom logic
    fullName: (parent) => {
      return `${parent.firstName} ${parent.lastName}`;
    },

    // Relationship
    posts: async (parent, _, { prisma }) => {
      return await prisma.post.findMany({
        where: { authorId: parent.id },
      });
    },
  },
};
```

### Resolver Best Practices

✅ **Keep resolvers thin:**

```javascript
// ❌ Bad - business logic in resolver
const resolvers = {
  Mutation: {
    createUser: async (_, { input }, { prisma }) => {
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await prisma.user.create({
        data: { ...input, password: hashedPassword },
      });
      sendWelcomeEmail(user.email);
      logUserCreation(user.id);
      return user;
    },
  },
};

// ✅ Good - delegate to service layer
const resolvers = {
  Mutation: {
    createUser: async (_, { input }, context) => {
      return await userService.create(input, context);
    },
  },
};
```

✅ **Use async/await:**

```javascript
// ✅ Clean and readable
Query: {
  user: async (_, { id }, { prisma }) => {
    return await prisma.user.findUnique({ where: { id } });
  };
}
```

✅ **Handle errors properly:**

```javascript
Query: {
  user: async (_, { id }, { prisma }) => {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new GraphQLError("User not found", {
        extensions: { code: "USER_NOT_FOUND" },
      });
    }

    return user;
  };
}
```

### What Should NOT Be in Resolvers

❌ **Business logic:**

- Complex calculations
- External API calls
- Email sending
- File processing

❌ **Direct database queries for complex operations:**

Use service layer for testability and reusability.

❌ **Authentication logic:**

Use middleware or context initialization.

**Good Pattern:**

```javascript
// resolvers/userResolvers.js
import { userService } from "../services/userService.js";

export const userResolvers = {
  Query: {
    users: (_, args, context) => userService.getAll(args, context),
    user: (_, { id }, context) => userService.getById(id, context),
  },
  Mutation: {
    createUser: (_, { input }, context) => userService.create(input, context),
    updateUser: (_, { id, input }, context) =>
      userService.update(id, input, context),
  },
};
```

---

## 6. Queries, Mutations, Subscriptions

### Queries

**Purpose:** Read data without side effects.

**Parallel Execution:** Multiple queries in one request run in parallel.

```graphql
query GetUserProfile {
  user(id: "1") {
    name
    email
  }
  posts {
    title
  }
}
```

**Naming Convention:**

```graphql
# Single resource
user(id: ID!): User
post(id: ID!): Post

# Multiple resources
users: [User!]!
posts(limit: Int): [Post!]!

# Current user
me: User

# Filtered/paginated
tasksByStatus(status: TaskStatus!): [Task!]!
paginatedPosts(first: Int, after: String): PostConnection!
```

### Mutations

**Purpose:** Modify data (create, update, delete).

**Sequential Execution:** Multiple mutations run sequentially to avoid race conditions.

```graphql
mutation CreateAndPublishPost {
  createPost(input: { title: "Hello" }) {
    id
  }
  publishPost(id: "...") {
    # Runs after createPost
    publishedAt
  }
}
```

**Naming Convention:**

```graphql
# Create
createUser(input: CreateUserInput!): User!
addPost(input: CreatePostInput!): Post!

# Update
updateUser(id: ID!, input: UpdateUserInput!): User!
editPost(id: ID!, input: UpdatePostInput!): Post!

# Delete
deleteUser(id: ID!): Boolean!
removePost(id: ID!): Boolean!

# Actions
publishPost(id: ID!): Post!
completeTask(id: ID!): Task!
```

### Subscriptions

**Purpose:** Real-time updates via WebSocket.

```graphql
type Subscription {
  taskCreated: Task!
  taskUpdated(id: ID!): Task!
  messageAdded(chatId: ID!): Message!
}
```

**Client Usage:**

```graphql
subscription OnTaskCreated {
  taskCreated {
    id
    title
    createdAt
  }
}
```

**Server Implementation (Apollo Server):**

```javascript
import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub();

const resolvers = {
  Mutation: {
    createTask: async (_, { input }, { prisma }) => {
      const task = await prisma.task.create({ data: input });

      // Publish event
      pubsub.publish("TASK_CREATED", { taskCreated: task });

      return task;
    },
  },

  Subscription: {
    taskCreated: {
      subscribe: () => pubsub.asyncIterator(["TASK_CREATED"]),
    },
  },
};
```

**Differences Summary:**

| Feature   | Query    | Mutation   | Subscription |
| --------- | -------- | ---------- | ------------ |
| Purpose   | Read     | Write      | Real-time    |
| Execution | Parallel | Sequential | Event-driven |
| Protocol  | HTTP     | HTTP       | WebSocket    |
| Caching   | Yes      | No         | No           |

---

## 7. Arguments & Variables

### Why Variables Matter

**Without variables (hardcoded):**

```graphql
# ❌ Must rebuild query for each user
query {
  user(id: "123") {
    name
  }
}
```

**With variables (dynamic):**

```graphql
# ✅ Reusable query
query GetUser($userId: ID!) {
  user(id: $userId) {
    name
  }
}

# Variables (separate JSON):
{
  "userId": "123"
}
```

**Benefits:**

- **Security** - Prevents injection attacks
- **Caching** - Same query, different variables
- **Reusability** - One query, many uses
- **Type safety** - Variables are validated

### Query vs Variables

**Query with inline arguments:**

```graphql
query {
  users(limit: 10, role: ADMIN) {
    name
  }
}
```

**Query with variables:**

```graphql
query GetUsers($limit: Int = 10, $role: Role) {
  users(limit: $limit, role: $role) {
    name
  }
}
```

```json
{
  "limit": 20,
  "role": "ADMIN"
}
```

### Input Validation

**Schema-level:**

```graphql
type Query {
  users(limit: Int = 10, offset: Int = 0, minAge: Int): [User!]!
}
```

**Resolver-level:**

```javascript
Query: {
  users: async (_, { limit, offset, minAge }) => {
    // Validation
    if (limit > 100) {
      throw new GraphQLError("Limit cannot exceed 100");
    }

    if (offset < 0) {
      throw new GraphQLError("Offset must be positive");
    }

    if (minAge !== undefined && minAge < 0) {
      throw new GraphQLError("Age must be positive");
    }

    return getUsers({ limit, offset, minAge });
  };
}
```

**Using validation libraries:**

```javascript
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

Mutation: {
  createUser: async (_, { input }) => {
    // Validate
    const validated = createUserSchema.parse(input);

    return await userService.create(validated);
  };
}
```

---

## 8. Context & Authentication

### Context Setup

**Express + Apollo Server:**

```javascript
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import jwt from "jsonwebtoken";

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req }) => {
      // Extract token
      const token = req.headers.authorization?.replace("Bearer ", "");

      // Verify and decode
      let user = null;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          user = await prisma.user.findUnique({
            where: { id: decoded.userId },
          });
        } catch (err) {
          // Invalid token - user remains null
        }
      }

      return {
        user,
        prisma,
      };
    },
  })
);
```

### JWT Handling

**Login Mutation:**

```javascript
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

Mutation: {
  login: async (_, { input }, { prisma }) => {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new GraphQLError("Invalid credentials");
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new GraphQLError("Invalid credentials");
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return { token, user };
  };
}
```

### User Injection

**Helper function:**

```javascript
export function requireAuth(context) {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return context.user;
}

export function optionalAuth(context) {
  return context.user || null;
}
```

**Usage in resolvers:**

```javascript
Query: {
  me: (_, __, context) => {
    const user = requireAuth(context);
    return user;
  },

  myTasks: async (_, __, { prisma, user }) => {
    requireAuth({ user });
    return await prisma.task.findMany({
      where: { userId: user.id }
    });
  }
}
```

### Role-based Access

**Schema:**

```graphql
enum Role {
  ADMIN
  USER
  GUEST
}

type User {
  id: ID!
  role: Role!
}
```

**Authorization helpers:**

```javascript
export function requireRole(context, allowedRoles) {
  const user = requireAuth(context);

  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError("Insufficient permissions", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return user;
}
```

**Usage:**

```javascript
Mutation: {
  deleteUser: async (_, { id }, context) => {
    requireRole(context, ['ADMIN']);

    return await prisma.user.delete({ where: { id } });
  },

  promoteToAdmin: async (_, { userId }, context) => {
    requireRole(context, ['ADMIN']);

    return await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' }
    });
  }
}
```

---

## 9. Error Handling

### GraphQL Error Format

**Structure:**

```json
{
  "errors": [
    {
      "message": "User not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["user"],
      "extensions": {
        "code": "USER_NOT_FOUND",
        "userId": "123"
      }
    }
  ],
  "data": {
    "user": null
  }
}
```

**Key Points:**

- `errors` array always present if errors occur
- `data` can be partial (some fields resolve, others error)
- `extensions` for custom error metadata

### Custom Errors

```javascript
import { GraphQLError } from "graphql";

// ❌ Don't do this
throw new Error("User not found");

// ✅ Do this
throw new GraphQLError("User not found", {
  extensions: {
    code: "USER_NOT_FOUND",
    userId: id,
  },
});
```

**Common error codes:**

```javascript
// Authentication
throw new GraphQLError("Not authenticated", {
  extensions: { code: "UNAUTHENTICATED" },
});

// Authorization
throw new GraphQLError("Insufficient permissions", {
  extensions: { code: "FORBIDDEN" },
});

// Validation
throw new GraphQLError("Invalid email format", {
  extensions: { code: "BAD_USER_INPUT", field: "email" },
});

// Not found
throw new GraphQLError("Resource not found", {
  extensions: { code: "NOT_FOUND" },
});
```

### Validation Errors

**Multiple field errors:**

```javascript
import { GraphQLError } from "graphql";

Mutation: {
  createUser: async (_, { input }) => {
    const errors = [];

    if (input.name.length < 2) {
      errors.push({ field: "name", message: "Too short" });
    }

    if (!input.email.includes("@")) {
      errors.push({ field: "email", message: "Invalid format" });
    }

    if (errors.length > 0) {
      throw new GraphQLError("Validation failed", {
        extensions: {
          code: "BAD_USER_INPUT",
          validationErrors: errors,
        },
      });
    }

    return await createUser(input);
  };
}
```

**Catching database errors:**

```javascript
Mutation: {
  createUser: async (_, { input }, { prisma }) => {
    try {
      return await prisma.user.create({ data: input });
    } catch (error) {
      // Prisma unique constraint violation
      if (error.code === "P2002") {
        throw new GraphQLError("Email already exists", {
          extensions: {
            code: "DUPLICATE_EMAIL",
            field: "email",
          },
        });
      }

      // Re-throw unknown errors
      throw error;
    }
  };
}
```

---

## 10. Performance & Scaling

### N+1 Problem

**The Problem:**

```javascript
// ❌ Causes N+1 queries
const resolvers = {
  Query: {
    users: () => getUsers(), // 1 query
  },
  User: {
    posts: (user) => getPostsByUserId(user.id), // N queries (one per user)
  },
};

// Requesting 100 users → 1 + 100 = 101 database queries!
```

**Solution 1: DataLoader**

```javascript
import DataLoader from "dataloader";

// Batch function
const batchGetPosts = async (userIds) => {
  const posts = await prisma.post.findMany({
    where: { userId: { in: userIds } },
  });

  // Group by userId
  const postsByUserId = {};
  posts.forEach((post) => {
    if (!postsByUserId[post.userId]) {
      postsByUserId[post.userId] = [];
    }
    postsByUserId[post.userId].push(post);
  });

  // Return in same order as userIds
  return userIds.map((id) => postsByUserId[id] || []);
};

// Create loader
const context = () => ({
  loaders: {
    postLoader: new DataLoader(batchGetPosts),
  },
});

// Use in resolver
User: {
  posts: (user, _, { loaders }) => {
    return loaders.postLoader.load(user.id);
  };
}
```

**Solution 2: Prisma Include**

```javascript
Query: {
  users: async (_, __, { prisma }) => {
    return await prisma.user.findMany({
      include: { posts: true }, // Single query with JOIN
    });
  };
}

// No User.posts resolver needed - auto-resolved
```

### Caching Strategies

**In-memory cache:**

```javascript
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache: new InMemoryLRUCache({
    maxSize: Math.pow(2, 20) * 100, // 100 MB
  }),
});
```

**Redis cache:**

```javascript
import { RedisCache } from "apollo-server-cache-redis";
import Redis from "ioredis";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache: new RedisCache({
    client: new Redis({
      host: "localhost",
      port: 6379,
    }),
  }),
});
```

**Response caching:**

```javascript
import responseCachePlugin from "@apollo/server-plugin-response-cache";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    responseCachePlugin({
      sessionId: (context) => context.user?.id || null,
      ttl: 300, // 5 minutes
    }),
  ],
});
```

**Field-level caching:**

```graphql
type Query {
  posts: [Post!]! @cacheControl(maxAge: 60)
  user(id: ID!): User @cacheControl(maxAge: 300)
}
```

### Pagination

**Offset-based:**

```graphql
type Query {
  posts(offset: Int = 0, limit: Int = 10): [Post!]!
}
```

```javascript
Query: {
  posts: async (_, { offset, limit }, { prisma }) => {
    return await prisma.post.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  };
}
```

**Pros:** Simple, random page access  
**Cons:** Performance degrades with large offsets, inconsistent with real-time data

**Cursor-based (recommended for large datasets):**

```graphql
type PostEdge {
  cursor: String!
  node: Post!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type Query {
  posts(first: Int, after: String): PostConnection!
}
```

```javascript
Query: {
  posts: async (_, { first = 10, after }, { prisma }) => {
    const posts = await prisma.post.findMany({
      take: first + 1,
      cursor: after ? { id: after } : undefined,
      orderBy: { createdAt: "desc" },
    });

    const hasNextPage = posts.length > first;
    const edges = posts.slice(0, first).map((post) => ({
      cursor: post.id,
      node: post,
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
      totalCount: await prisma.post.count(),
    };
  };
}
```

**Pros:** Consistent results, efficient for real-time data  
**Cons:** More complex, no random page access

---

## 11. Best Practices

### Folder Structure

**Small projects:**

```
src/
├── schema/
│   ├── typeDefs.js
│   └── resolvers.js
├── utils/
│   └── auth.js
└── server.js
```

**Medium projects:**

```
src/
├── schema/
│   ├── user/
│   │   ├── user.typeDefs.js
│   │   └── user.resolvers.js
│   ├── post/
│   │   ├── post.typeDefs.js
│   │   └── post.resolvers.js
│   └── index.js
├── services/
│   ├── userService.js
│   └── postService.js
├── utils/
│   ├── auth.js
│   └── validation.js
└── server.js
```

**Large projects:**

```
src/
├── modules/
│   ├── user/
│   │   ├── user.schema.js
│   │   ├── user.resolvers.js
│   │   ├── user.service.js
│   │   └── user.validators.js
│   ├── post/
│   │   ├── post.schema.js
│   │   ├── post.resolvers.js
│   │   ├── post.service.js
│   │   └── post.validators.js
│   └── index.js
├── shared/
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   └── types/
├── config/
│   ├── database.js
│   └── apollo.js
└── server.js
```

### Service-based Architecture

```javascript
// ❌ Bad - logic in resolvers
const resolvers = {
  Query: {
    user: async (_, { id }, { prisma }) => {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) throw new GraphQLError("Not found");
      return user;
    },
  },
  Mutation: {
    createUser: async (_, { input }, { prisma }) => {
      const hashedPassword = await bcrypt.hash(input.password, 10);
      return await prisma.user.create({
        data: { ...input, password: hashedPassword },
      });
    },
  },
};

// ✅ Good - thin resolvers, fat services
// resolvers/userResolvers.js
import { userService } from "../services/userService.js";

export const userResolvers = {
  Query: {
    user: (_, { id }, context) => userService.getById(id, context),
  },
  Mutation: {
    createUser: (_, { input }, context) => userService.create(input, context),
  },
};

// services/userService.js
import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";

export const userService = {
  async getById(id, { prisma }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return user;
  },

  async create(input, { prisma }) {
    const hashedPassword = await bcrypt.hash(input.password, 10);

    try {
      return await prisma.user.create({
        data: { ...input, password: hashedPassword },
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new GraphQLError("Email already exists", {
          extensions: { code: "DUPLICATE_EMAIL" },
        });
      }
      throw error;
    }
  },
};
```

### Security Rules

**Query complexity limits:**

```javascript
import { createComplexityLimitRule } from "graphql-validation-complexity";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [createComplexityLimitRule(1000)],
});
```

**Depth limiting:**

```javascript
import depthLimit from "graphql-depth-limit";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5)],
});
```

**Rate limiting:**

```javascript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/graphql", limiter);
```

**Query whitelisting (production):**

```javascript
const allowedQueries = new Set(["GetUser", "GetPosts", "CreatePost"]);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    {
      async requestDidStart() {
        return {
          async didResolveOperation({ request, document }) {
            const operationName = request.operationName;

            if (!allowedQueries.has(operationName)) {
              throw new GraphQLError("Operation not allowed");
            }
          },
        };
      },
    },
  ],
});
```

### Schema Evolution

**Adding fields (safe):**

```graphql
# Before
type User {
  id: ID!
  name: String!
}

# After - backward compatible
type User {
  id: ID!
  name: String!
  email: String! # New field
}
```

**Deprecating fields:**

```graphql
type User {
  id: ID!
  username: String! @deprecated(reason: "Use 'name' instead")
  name: String!
}
```

**Making fields nullable (breaking):**

```graphql
# Before
type User {
  name: String!
}

# After - BREAKING CHANGE
type User {
  name: String # Clients expecting non-null will break
}
```

**Removing fields (breaking):**

```graphql
# Before
type User {
  id: ID!
  age: Int!
}

# After - BREAKING CHANGE
type User {
  id: ID!
  # age removed - queries requesting it will fail
}
```

---

## 12. GraphQL Cheat Sheet

### Common Queries

```graphql
# Get single resource
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}

# Get multiple resources
query GetUsers($limit: Int = 10) {
  users(limit: $limit) {
    id
    name
  }
}

# Nested data
query GetUserWithPosts($id: ID!) {
  user(id: $id) {
    name
    posts {
      title
      comments {
        text
      }
    }
  }
}

# Multiple queries in one request
query GetDashboard {
  me {
    name
  }
  myTasks {
    title
  }
  recentPosts {
    title
  }
}

# Aliases
query {
  admin: user(id: "1") {
    name
  }
  guest: user(id: "2") {
    name
  }
}

# Fragments
fragment UserInfo on User {
  id
  name
  email
}

query {
  user1: user(id: "1") {
    ...UserInfo
  }
  user2: user(id: "2") {
    ...UserInfo
  }
}
```

### Common Mutations

```graphql
# Create
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}

# Update
mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    email
  }
}

# Delete
mutation DeleteUser($id: ID!) {
  deleteUser(id: $id)
}

# Multiple mutations (run sequentially)
mutation CreateAndPublish {
  createPost(input: { title: "Hello" }) {
    id
  }
  publishPost(id: "...") {
    publishedAt
  }
}
```

### Common SDL Patterns

```graphql
# Base types
type User {
  id: ID!
  name: String!
  email: String!
  age: Int
  isActive: Boolean!
  role: Role!
  posts: [Post!]!
}

# Enums
enum Role {
  ADMIN
  USER
  GUEST
}

# Input types
input CreateUserInput {
  name: String!
  email: String!
  password: String!
}

input UpdateUserInput {
  name: String
  email: String
}

# Interfaces
interface Node {
  id: ID!
  createdAt: String!
}

type User implements Node {
  id: ID!
  createdAt: String!
  name: String!
}

# Unions
union SearchResult = User | Post | Comment

type Query {
  search(term: String!): [SearchResult!]!
}

# Pagination
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  cursor: String!
  node: Post!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Resolver Patterns

```javascript
// Basic resolver
const resolvers = {
  Query: {
    hello: () => "Hello World!",
  },
};

// With arguments
Query: {
  user: (_, { id }) => getUserById(id);
}

// Async resolver
Query: {
  users: async (_, __, { prisma }) => {
    return await prisma.user.findMany();
  };
}

// Field resolver
User: {
  posts: async (parent, _, { prisma }) => {
    return await prisma.post.findMany({
      where: { userId: parent.id },
    });
  };
}

// With authentication
Query: {
  me: (_, __, context) => {
    requireAuth(context);
    return context.user;
  };
}

// Error handling
Query: {
  user: async (_, { id }, { prisma }) => {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return user;
  };
}

// Computed field
User: {
  fullName: (parent) => `${parent.firstName} ${parent.lastName}`;
}
```

---

## 13. Setup Guides

### React + GraphQL + TanStack Query

**Tech Stack:**

- React (Vite)
- GraphQL (client-side fetching)
- TanStack Query (state management)

**Installation:**

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install @tanstack/react-query graphql graphql-request
```

**Setup:**

```javascript
// src/lib/graphql.js
import { GraphQLClient } from "graphql-request";

export const graphqlClient = new GraphQLClient(
  "http://localhost:4000/graphql",
  {
    headers: () => {
      const token = localStorage.getItem("token");
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  }
);

// src/main.jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

// src/queries/userQueries.js
import { gql } from "graphql-request";

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
    }
  }
`;

// src/components/Users.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "../lib/graphql";
import { GET_USERS, CREATE_USER } from "../queries/userQueries";

function Users() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => graphqlClient.request(GET_USERS),
  });

  const createMutation = useMutation({
    mutationFn: (input) => graphqlClient.request(CREATE_USER, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data.users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

**Common Mistakes:**

- Not invalidating queries after mutations
- Forgetting to handle loading states
- Not setting up authentication headers

---

### Next.js (App Router) + GraphQL

**Tech Stack:**

- Next.js 14+ (App Router)
- GraphQL (Server Actions)
- Prisma

**Installation:**

```bash
npx create-next-app@latest my-app
cd my-app
npm install graphql @apollo/server @as-integrations/next prisma
npx prisma init
```

**Setup:**

```javascript
// app/api/graphql/route.js
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => ({ req }),
});

export { handler as GET, handler as POST };

// lib/graphql-client.js
async function fetchGraphQL(query, variables = {}) {
  const res = await fetch("http://localhost:3000/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data;
}

// app/users/page.jsx
import { fetchGraphQL } from "@/lib/graphql-client";

const GET_USERS = `
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

export default async function UsersPage() {
  const data = await fetchGraphQL(GET_USERS);

  return (
    <div>
      {data.users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

**Common Mistakes:**

- Mixing Pages Router with App Router patterns
- Not using Server Components properly
- Incorrect caching strategies

---

### Express + MongoDB (Mongoose)

**Tech Stack:**

- Express
- Apollo Server
- MongoDB (Mongoose)

**Installation:**

```bash
mkdir my-api && cd my-api
npm init -y
npm install express @apollo/server graphql mongoose dotenv
```

**Setup:**

```javascript
// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);

// schema/typeDefs.js
export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
  }
  
  type Query {
    users: [User!]!
    user(id: ID!): User
  }
  
  type Mutation {
    createUser(name: String!, email: String!, password: String!): User!
  }
`;

// schema/resolvers.js
import { User } from "../models/User.js";

export const resolvers = {
  Query: {
    users: async () => await User.find(),
    user: async (_, { id }) => await User.findById(id),
  },

  Mutation: {
    createUser: async (_, { name, email, password }) => {
      const user = new User({ name, email, password });
      return await user.save();
    },
  },
};

// server.js
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import mongoose from "mongoose";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";

const app = express();

await mongoose.connect(process.env.MONGODB_URI);

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use("/graphql", express.json(), expressMiddleware(server));

app.listen(4000, () =>
  console.log("Server running on http://localhost:4000/graphql")
);
```

**Folder Structure:**

```
my-api/
├── models/
│   ├── User.js
│   └── Post.js
├── schema/
│   ├── typeDefs.js
│   └── resolvers.js
├── utils/
│   └── auth.js
├── .env
├── server.js
└── package.json
```

**Common Mistakes:**

- Not handling MongoDB connection errors
- Forgetting indexes for frequently queried fields
- Not validating data before saving

---

### NestJS + Prisma + PostgreSQL

**Tech Stack:**

- NestJS
- GraphQL (Code-first)
- Prisma
- PostgreSQL

**Installation:**

```bash
npm i -g @nestjs/cli
nest new my-api
cd my-api
npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql
npm install prisma @prisma/client
npx prisma init
```

**Setup:**

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
    }),
    UserModule,
  ],
})
export class AppModule {}

// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
}

// user/user.model.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  createdAt: Date;
}

// user/user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: { name: string; email: string }) {
    return this.prisma.user.create({ data });
  }
}

// user/user.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './user.model';

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  users() {
    return this.userService.findAll();
  }

  @Query(() => User)
  user(@Args('id') id: string) {
    return this.userService.findOne(id);
  }

  @Mutation(() => User)
  createUser(
    @Args('name') name: string,
    @Args('email') email: string,
  ) {
    return this.userService.create({ name, email });
  }
}
```

**Common Mistakes:**

- Not decorating classes properly
- Mixing code-first and schema-first approaches
- Forgetting to run `npx prisma generate` after schema changes

---

### NestJS + MongoDB

**Tech Stack:**

- NestJS
- GraphQL
- MongoDB (Mongoose)

**Installation:**

```bash
nest new my-api
cd my-api
npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql
npm install @nestjs/mongoose mongoose
```

**Setup:**

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver } from "@nestjs/apollo";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: "schema.gql",
    }),
    UserModule,
  ],
})
export class AppModule {}

// user/user.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// user/user.model.ts
import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;
}

// user/user.resolver.ts
import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UserService } from "./user.service";
import { UserType } from "./user.model";

@Resolver(() => UserType)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [UserType])
  async users() {
    return this.userService.findAll();
  }

  @Mutation(() => UserType)
  async createUser(@Args("name") name: string, @Args("email") email: string) {
    return this.userService.create({ name, email });
  }
}
```

**Common Mistakes:**

- Confusing Mongoose schema with GraphQL schema
- Not handling MongoDB connection errors
- Forgetting to add modules to imports

---

### Express + Prisma + PostgreSQL

**Tech Stack:**

- Express
- Apollo Server
- Prisma
- PostgreSQL

**Installation:**

```bash
mkdir my-api && cd my-api
npm init -y
npm install express @apollo/server graphql prisma @prisma/client dotenv
npx prisma init
```

**Setup:**

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  tasks     Task[]
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
}

// lib/prisma.js
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// schema/typeDefs.js
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
    createdAt: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    tasks: [Task!]!
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
  }

  input CreateTaskInput {
    title: String!
    description: String
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    createTask(input: CreateTaskInput!, userId: ID!): Task!
    updateTask(id: ID!, completed: Boolean!): Task!
  }
`;

// schema/resolvers.js
import { prisma } from '../lib/prisma.js';

export const resolvers = {
  Query: {
    users: async () => await prisma.user.findMany(),
    user: async (_, { id }) => await prisma.user.findUnique({ where: { id } }),
    tasks: async () => await prisma.task.findMany()
  },

  Mutation: {
    createUser: async (_, { input }) => {
      return await prisma.user.create({ data: input });
    },
    createTask: async (_, { input, userId }) => {
      return await prisma.task.create({
        data: { ...input, userId }
      });
    },
    updateTask: async (_, { id, completed }) => {
      return await prisma.task.update({
        where: { id },
        data: { completed }
      });
    }
  },

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
};

// server.js
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './schema/resolvers.js';
import { prisma } from './lib/prisma.js';

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers
});

await server.start();

app.use(
  '/graphql',
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => ({ req, prisma })
  })
);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/graphql`);
});
```

**Folder Structure:**

```
my-api/
├── prisma/
│   └── schema.prisma
├── schema/
│   ├── typeDefs.js
│   └── resolvers.js
├── lib/
│   └── prisma.js
├── .env
├── server.js
└── package.json
```

**Running:**

```bash
# Setup database
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start server
node server.js
```

**Common Mistakes:**

- Forgetting to run `prisma generate` after schema changes
- Not handling Prisma errors (P2002 for unique constraints)
- Missing foreign key relations in schema
- Not using transactions for related operations

---

**End of GraphQL Learning Notes**

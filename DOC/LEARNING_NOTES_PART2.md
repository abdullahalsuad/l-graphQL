# GraphQL Learning Notes - Part 2 (Topics 11-20)

## 11. Pagination

### What is it?

**Pagination** is splitting large datasets into smaller chunks to improve performance and user experience.

### Why is it needed?

Returning 10,000 tasks in one query would:

- Crash the browser
- Waste bandwidth
- Take forever to render

### Two Approaches

#### **Offset-based Pagination (Simple)**

```graphql
query {
  tasks(limit: 10, offset: 20) {
    id
    title
  }
}
```

**Pros:** Easy to implement  
**Cons:**

- Inconsistent with real-time data (items shift between pages)
- Performance degrades with large offsets

**Resolver:**

```javascript
tasksOffset: async (_, { limit = 10, offset = 0 }) => {
  return await prisma.task.findMany({
    take: limit,
    skip: offset,
  });
};
```

#### **Cursor-based Pagination (Recommended)**

```graphql
query {
  tasksCursor(first: 10, after: "cursor123") {
    edges {
      node {
        id
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Pros:**

- Consistent results even with data changes
- Better performance

**Resolver:**

```javascript
tasksCursor: async (_, { first = 10, after }) => {
  const tasks = await prisma.task.findMany({
    take: first + 1,
    ...(after && { cursor: { id: after }, skip: 1 }),
    orderBy: { createdAt: "desc" },
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
      endCursor: edges[edges.length - 1]?.cursor,
    },
  };
};
```

### Common Mistakes

❌ Not implementing pagination (performance nightmare)  
❌ Using offset for large datasets  
❌ Not providing `totalCount`

### Best Practices

✅ Use cursor-based for production  
✅ Provide reasonable limits (max 100)  
✅ Return `totalCount` for UI

---

## 12. Authentication (JWT)

### What is it?

**Authentication** is verifying **WHO** the user is.

**JWT (JSON Web Token)** is a secure way to transmit user identity.

### Why is it needed?

- Protect private data
- Know which user is making requests
- Maintain sessions

### How it works?

**JWT Structure:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.  ← Header
eyJ1c2VySWQiOiIxMjMifQ.                ← Payload (data)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature
```

**Flow:**

1. User logs in with email/password
2. Server verifies credentials
3. Server generates JWT containing userId
4. Client stores JWT (localStorage)
5. Client sends JWT in every request
6. Server verifies JWT and extracts userId

### How we use it in this project

**Generate Token:**

```javascript
import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};
```

**Verify Token:**

```javascript
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};
```

**Login Mutation:**

```javascript
login: async (_, { input }) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AuthenticationError("Invalid credentials");
  }

  const isValid = await comparePassword(input.password, user.password);

  if (!isValid) {
    throw new AuthenticationError("Invalid credentials");
  }

  const token = generateToken(user.id);
  return { token, user };
};
```

**Client Usage:**

```javascript
// Store token
localStorage.setItem('token', data.login.token);

// Send in requests
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Common Mistakes

❌ Storing passwords in plain text  
❌ Not setting token expiration  
❌ Exposing JWT secret  
❌ Not validating tokens

### Best Practices

✅ Hash passwords (bcryptjs)  
✅ Use strong JWT secrets  
✅ Set reasonable expiration (7 days)  
✅ Use HTTPS in production

---

## 13. Authorization

### What is it?

**Authorization** is verifying **WHAT** the user can do.

**Authentication:** Who are you?  
**Authorization:** Can you do this?

### Why is it needed?

Users should only access/modify their own data:

- User A shouldn't delete User B's tasks
- Admin should have more permissions

### How it works?

**Check Authentication:**

```javascript
const requireAuth = (context) => {
  if (!context.user) {
    throw new AuthenticationError("You must be logged in");
  }
  return context.user;
};
```

**Check Ownership:**

```javascript
deleteTask: async (_, { id }, context) => {
  const user = requireAuth(context);

  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  if (task.userId !== user.id) {
    throw new ForbiddenError("You can only delete your own tasks");
  }

  return await prisma.task.delete({ where: { id } });
};
```

### How we use it in this project

**Protected Queries:**

```javascript
Query: {
  me: (_, __, context) => {
    requireAuth(context);  // Must be logged in
    // ...
  },

  myTasks: (_, __, context) => {
    const user = requireAuth(context);
    return prisma.task.findMany({
      where: { userId: user.id }  // Only your tasks
    });
  }
}
```

**Protected Mutations:**

```javascript
Mutation: {
  updateTask: async (_, { id, input }, context) => {
    const user = requireAuth(context);

    const task = await prisma.task.findUnique({ where: { id } });

    if (task.userId !== user.id) {
      throw new ForbiddenError("Not authorized");
    }

    return await prisma.task.update({
      where: { id },
      data: input,
    });
  };
}
```

### Common Mistakes

❌ Checking auth in frontend only (easy to bypass)  
❌ Not checking ownership  
❌ Returning sensitive error messages

### Best Practices

✅ Always validate on the server  
✅ Check both authentication AND ownership  
✅ Use role-based access control (RBAC) for complex apps

---

## 14. Error Handling

### What is it?

Proper **error handling** ensures users get helpful error messages instead of crashes.

### Why is it needed?

- Better debugging
- Better user experience
- Security (don't expose internal errors)

### How it works?

**Custom Error Classes:**

```javascript
import { GraphQLError } from "graphql";

export class AuthenticationError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

export class ValidationError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
}
```

**Using Errors:**

```javascript
if (!user) {
  throw new AuthenticationError("You must be logged in");
}

if (password.length < 6) {
  throw new ValidationError("Password must be at least 6 characters");
}

if (!task) {
  throw new NotFoundError("Task not found");
}

if (task.userId !== user.id) {
  throw new ForbiddenError("Not authorized");
}
```

**Client Receives:**

```json
{
  "errors": [
    {
      "message": "You must be logged in",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

### How we use it in this project

**Error Types:**

- `AuthenticationError` - Not logged in
- `ForbiddenError` - Not authorized
- `ValidationError` - Invalid input
- `NotFoundError` - Resource doesn't exist

**Example:**

```javascript
register: async (_, { input }) => {
  if (input.password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters");
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ValidationError("Email already in use");
  }

  // Continue...
};
```

### Common Mistakes

❌ Throwing generic errors  
❌ Exposing database errors to clients  
❌ Not logging errors server-side

### Best Practices

✅ Use specific error types  
✅ Log errors for debugging  
✅ Don't expose stack traces in production

---

## 15. Context Usage

### What is it?

**Context** is an object **shared across all resolvers** in a single request.

### Why is it needed?

- Avoid passing the same data repeatedly
- Share authenticated user
- Share database connections

### How it works?

**Server Setup:**

```javascript
import { verifyToken } from "./utils/auth.js";

const getContext = async ({ req }) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return { user: null };
  }

  const decoded = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  return { user };
};

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: getContext, // Called for every request
  })
);
```

**Resolver Access:**

```javascript
const resolvers = {
  Query: {
    me: (parent, args, context) => {
      // context.user is available here!
      if (!context.user) {
        throw new AuthenticationError("Not logged in");
      }
      return context.user;
    },
  },
};
```

### How we use it in this project

**Context Content:**

```javascript
{
  user: {
    id: "user-uuid",
    name: "John Doe",
    email: "john@example.com"
  }
}
```

**Usage:**

```javascript
createTask: async (_, { input }, context) => {
  const user = requireAuth(context); // Get user from context

  return await prisma.task.create({
    data: {
      ...input,
      userId: user.id, // Use authenticated user's ID
    },
  });
};
```

### Common Mistakes

❌ Putting heavy logic in context function  
❌ Not handling missing tokens gracefully  
❌ Storing sensitive data in context

### Best Practices

✅ Keep context function fast  
✅ Return `null` for missing auth, don't throw  
✅ Use context for request-scoped data only

---

## 16. Environment Variables

### What is it?

**Environment variables** store **configuration** outside your code.

### Why is it needed?

- Keep secrets out of source code
- Different configs for dev/prod
- Security (don't commit secrets to Git)

### How it works?

**Create `.env` file:**

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-super-secret-key"
PORT=4000
```

**Add to `.gitignore`:**

```
.env
```

**Create `.env.example` for documentation:**

```env
DATABASE_URL="your-database-url"
JWT_SECRET="your-secret-key"
PORT=4000
```

**Load in code:**

```javascript
import "dotenv/config"; // Load .env file

const PORT = process.env.PORT || 4000;
const secret = process.env.JWT_SECRET;
```

### How we use it in this project

**`.env` file:**

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="my-super-secret-jwt-key-for-development-only"
PORT=4000
```

**Usage:**

```javascript
// In auth.js
jwt.sign({ userId }, process.env.JWT_SECRET, {
  expiresIn: "7d",
});

// In index.js
const PORT = process.env.PORT || 4000;
```

### Common Mistakes

❌ Committing `.env` to Git  
❌ Using same secrets in dev/prod  
❌ Hardcoding values instead of using env vars

### Best Practices

✅ Never commit `.env`  
✅ Provide `.env.example`  
✅ Use strong secrets in production  
✅ Validate required env vars on startup

---

## 17. N+1 Problem

### What is it?

The **N+1 problem** is a performance issue where you make **1 query to get N items**, then **N queries to get related data**.

### Why is it a problem?

**Example:**

```javascript
// Get 100 users (1 query)
const users = await prisma.user.findMany();

// Get tasks for each user (100 queries!)
for (const user of users) {
  user.tasks = await prisma.task.findMany({
    where: { userId: user.id },
  });
}

// Total: 101 queries!
```

### How to solve it?

#### **Solution 1: Use Prisma `include`**

```javascript
const users = await prisma.user.findMany({
  include: { tasks: true }, // Single optimized query!
});
```

#### **Solution 2: DataLoader (Advanced)**

```javascript
import DataLoader from "dataloader";

const taskLoader = new DataLoader(async (userIds) => {
  const tasks = await prisma.task.findMany({
    where: { userId: { in: userIds } },
  });

  return userIds.map((id) => tasks.filter((task) => task.userId === id));
});

// Usage
User: {
  tasks: (parent) => taskLoader.load(parent.id);
}
```

### How we use it in this project

**Good (Optimized):**

```javascript
Query: {
  users: async () => {
    return await prisma.user.findMany({
      include: { tasks: true }, // Efficient!
    });
  };
}
```

**Bad (N+1):**

```javascript
User: {
  tasks: async (parent) => {
    // This runs for EVERY user!
    return await prisma.task.findMany({
      where: { userId: parent.id },
    });
  };
}
```

### Common Mistakes

❌ Not using `include` in Prisma  
❌ Making queries inside loops  
❌ Not batching requests

### Best Practices

✅ Use Prisma `include` for simple cases  
✅ Use DataLoader for complex scenarios  
✅ Monitor query count in development

---

## 18. Schema Design Best Practices

### Naming Conventions

✅ **Types:** PascalCase (`User`, `Task`)  
✅ **Fields:** camelCase (`createdAt`, `firstName`)  
✅ **Queries:** Descriptive verbs (`getUser`, `myTasks`)  
✅ **Mutations:** Action verbs (`createTask`, `updateUser`)

### Type Design

```graphql
# Good
type User {
  id: ID!
  name: String!
  email: String!
  tasks: [Task!]!
}

# Bad (too nested, too many fields)
type User {
  id: ID!
  personalInfo: {
    firstName: String
    lastName: String
    middleName: String
    suffix: String
  }
  # ... 50 more fields
}
```

### Mutation Patterns

```graphql
# Good: Return the modified object
type Mutation {
  createTask(input: CreateTaskInput!): Task!
  updateTask(id: ID!, input: UpdateTaskInput!): Task!
  deleteTask(id: ID!): Task!
}

# Better: Return payload with more info
type Mutation {
  createTask(input: CreateTaskInput!): TaskPayload!
}

type TaskPayload {
  task: Task!
  errors: [Error!]
}
```

### Nullability

```graphql
# Make required fields non-null
type User {
  id: ID! # Will always exist
  name: String! # Required
  bio: String # Optional
  tasks: [Task!]! # Array won't be null, items won't be null
}
```

### Common Mistakes

❌ Using verbs in type names (`GetUser`)  
❌ Deeply nested types  
❌ Returning Boolean from mutations  
❌ Inconsistent naming

### Best Practices

✅ Keep types flat  
✅ Return objects from mutations  
✅ Use Input Types for mutations  
✅ Be consistent with naming

---

## 19. Frontend Queries & Mutations

### Apollo Client Setup

```typescript
import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "http://localhost:4000/graphql",
  cache: new InMemoryCache(),
});
```

### Using Queries

```typescript
import { useQuery, gql } from "@apollo/client";

const GET_TASKS = gql`
  query GetMyTasks {
    myTasks {
      id
      title
      completed
    }
  }
`;

function TaskList() {
  const { data, loading, error } = useQuery(GET_TASKS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data.myTasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

### Using Mutations

```typescript
import { useMutation, gql } from "@apollo/client";

const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
    }
  }
`;

function CreateTaskForm() {
  const [createTask, { loading }] = useMutation(CREATE_TASK, {
    refetchQueries: ["GetMyTasks"], // Refresh task list
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createTask({
      variables: {
        input: { title: "New Task" },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={loading}>Create Task</button>
    </form>
  );
}
```

### Authentication

```typescript
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

### Common Mistakes

❌ Not handling loading states  
❌ Not refetching after mutations  
❌ Forgetting to send auth tokens

### Best Practices

✅ Use `refetchQueries` or `update` cache manually  
✅ Handle loading, error, and success states  
✅ Store tokens securely (httpOnly cookies in production)

---

## 20. Apollo Client Cache

### What is it?

Apollo Client **automatically caches** query results to avoid redundant network requests.

### Why is it needed?

- Faster UI (instant results from cache)
- Reduced server load
- Offline support

### How it works?

**Automatic Caching:**

```typescript
// First time: Fetches from network
const { data } = useQuery(GET_TASKS);

// Second time: Returns from cache instantly!
const { data } = useQuery(GET_TASKS);
```

**Cache Updates:**

```typescript
const [createTask] = useMutation(CREATE_TASK, {
  update: (cache, { data }) => {
    const existing = cache.readQuery({ query: GET_TASKS });
    cache.writeQuery({
      query: GET_TASKS,
      data: {
        myTasks: [...existing.myTasks, data.createTask],
      },
    });
  },
});
```

**Cache Configuration:**

```typescript
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        myTasks: {
          merge(existing = [], incoming) {
            return incoming; // Always use fresh data
          },
        },
      },
    },
  },
});
```

### How we use it in this project

**Config:**

```typescript
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          myTasks: {
            merge: (existing = [], incoming) => incoming,
          },
        },
      },
    },
  }),
});
```

**Usage:**

```typescript
const [deleteTask] = useMutation(DELETE_TASK, {
  onCompleted: () => refetch(), // Refresh cache
});
```

### Common Mistakes

❌ Not normalizing cache properly  
❌ Forgetting to update cache after mutations  
❌ Not setting cache policies

### Best Practices

✅ Use refetchQueries for simple cases  
✅ Manually update cache for complex scenarios  
✅ Clear cache on logout

---

## 🎉 Congratulations!

You've completed all 20 topics! You now understand:

- ✅ GraphQL fundamentals
- ✅ Building a GraphQL API with Apollo Server
- ✅ Database modeling with Prisma
- ✅ Authentication & Authorization
- ✅ Frontend integration with React + Apollo Client

### Next Steps:

1. Add real-time updates (Subscriptions)
2. Implement DataLoader
3. Deploy to production
4. Add file uploads
5. Implement role-based permissions

**Happy coding! 🚀**

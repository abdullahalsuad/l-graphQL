# 📝 GraphQL Cheat Sheet - Quick Reference

## 🔐 Authentication

### Register

```graphql
mutation Register {
  register(
    input: {
      name: "Your Name"
      email: "your@email.com"
      password: "yourpassword"
    }
  ) {
    token
    user {
      id
      name
      email
    }
  }
}
```

### Login

```graphql
mutation Login {
  login(input: { email: "your@email.com", password: "yourpassword" }) {
    token
    user {
      id
      name
    }
  }
}
```

### Set Authorization Header (After Login)

```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

---

## 👤 User Queries

### Get Current User

```graphql
query GetMe {
  me {
    id
    name
    email
    createdAt
    tasks {
      id
      title
      completed
    }
  }
}
```

### Get Specific User

```graphql
query GetUser {
  user(id: "user-id-here") {
    id
    name
    email
    tasks {
      title
    }
  }
}
```

### Get All Users

```graphql
query GetAllUsers {
  users {
    id
    name
    email
    tasks {
      id
      title
    }
  }
}
```

---

## ✅ Task Queries

### Get My Tasks

```graphql
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
```

### Get Single Task

```graphql
query GetTask {
  task(id: "task-id-here") {
    id
    title
    description
    completed
    user {
      name
    }
  }
}
```

### Offset Pagination

```graphql
query GetTasksOffset {
  tasksOffset(limit: 10, offset: 0) {
    id
    title
    completed
  }
}
```

### Cursor Pagination (Recommended)

```graphql
query GetTasksCursor {
  tasksCursor(first: 10) {
    edges {
      cursor
      node {
        id
        title
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
```

### Cursor Pagination - Next Page

```graphql
query GetNextPage {
  tasksCursor(first: 10, after: "CURSOR_FROM_PREVIOUS_QUERY") {
    edges {
      cursor
      node {
        id
        title
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

---

## 📝 Task Mutations

### Create Task

```graphql
mutation CreateTask {
  createTask(
    input: { title: "My New Task", description: "Task description here" }
  ) {
    id
    title
    description
    completed
    createdAt
  }
}
```

### Update Task

```graphql
mutation UpdateTask {
  updateTask(
    id: "task-id-here"
    input: {
      title: "Updated Title"
      description: "Updated description"
      completed: true
    }
  ) {
    id
    title
    description
    completed
    updatedAt
  }
}
```

### Toggle Task Completion

```graphql
mutation ToggleTask {
  toggleTaskComplete(id: "task-id-here") {
    id
    completed
  }
}
```

### Delete Task

```graphql
mutation DeleteTask {
  deleteTask(id: "task-id-here") {
    id
    title
  }
}
```

---

## 🔍 Advanced Query Patterns

### Nested Queries

```graphql
query NestedQuery {
  me {
    name
    tasks {
      title
      completed
    }
  }
}
```

### Query with Variables

```graphql
query GetUserWithVariable($userId: ID!) {
  user(id: $userId) {
    id
    name
    tasks {
      title
    }
  }
}

# Variables (in a separate panel):
{
  "userId": "user-id-here"
}
```

### Multiple Queries in One Request

```graphql
query MultipleQueries {
  me {
    name
  }
  myTasks {
    id
    title
  }
}
```

### Query Aliases

```graphql
query WithAliases {
  currentUser: me {
    name
  }
  allMyTasks: myTasks {
    title
  }
}
```

---

## 🎨 Fragments (Code Reuse)

### Define and Use Fragment

```graphql
fragment TaskFields on Task {
  id
  title
  description
  completed
  createdAt
  updatedAt
}

query GetTasks {
  myTasks {
    ...TaskFields
  }
}

query GetSingleTask {
  task(id: "task-id") {
    ...TaskFields
    user {
      name
    }
  }
}
```

---

## 🏃 Quick Test Workflow

### 1. Register

```graphql
mutation {
  register(
    input: { name: "Test User", email: "test@test.com", password: "test123" }
  ) {
    token
  }
}
```

### 2. Copy Token → Set Header

```json
{ "Authorization": "Bearer <token>" }
```

### 3. Create Tasks

```graphql
mutation {
  task1: createTask(input: { title: "Task 1" }) {
    id
  }
  task2: createTask(input: { title: "Task 2" }) {
    id
  }
  task3: createTask(input: { title: "Task 3" }) {
    id
  }
}
```

### 4. Get All Tasks

```graphql
query {
  myTasks {
    id
    title
    completed
  }
}
```

### 5. Toggle & Update

```graphql
mutation {
  toggleTaskComplete(id: "task-id-1") {
    id
    completed
  }
}
```

---

## ⚠️ Error Examples

### Authentication Error

```graphql
# Without token in header:
query {
  myTasks {
    title
  }
}

# Response:
{
  "errors": [{
    "message": "You must be logged in to perform this action",
    "extensions": { "code": "UNAUTHENTICATED" }
  }]
}
```

### Validation Error

```graphql
mutation {
  register(input: {
    name: "A"  # Too short
    email: "invalid"  # Invalid format
    password: "123"  # Too short
  }) {
    token
  }
}

# Response:
{
  "errors": [{
    "message": "Name must be at least 2 characters",
    "extensions": { "code": "BAD_USER_INPUT" }
  }]
}
```

### Not Found Error

```graphql
query {
  task(id: "non-existent-id") {
    title
  }
}

# Response:
{
  "errors": [{
    "message": "Task not found",
    "extensions": { "code": "NOT_FOUND" }
  }]
}
```

### Forbidden Error

```graphql
# Trying to delete someone else's task:
mutation {
  deleteTask(id: "other-users-task-id") {
    id
  }
}

# Response:
{
  "errors": [{
    "message": "You can only delete your own tasks",
    "extensions": { "code": "FORBIDDEN" }
  }]
}
```

---

## 🛠 Useful Apollo Sandbox Features

### Keyboard Shortcuts

- `Ctrl + Enter` - Run query
- `Ctrl + Space` - Auto-complete
- `Ctrl + B` - Prettify query

### Explorer Panel

- Click fields to build queries visually
- See schema documentation

### Variables Panel

- Test queries with dynamic values
- Bottom left corner

### Headers Panel

- Add Authorization header
- Bottom left corner

---

## 📊 Schema Introspection

### Get Schema Types

```graphql
query GetTypes {
  __schema {
    types {
      name
      kind
    }
  }
}
```

### Get Query Types

```graphql
query GetQueryFields {
  __schema {
    queryType {
      fields {
        name
        description
      }
    }
  }
}
```

### Get Type Details

```graphql
query GetTypeDetails {
  __type(name: "User") {
    name
    fields {
      name
      type {
        name
      }
    }
  }
}
```

---

## 💡 Pro Tips

### 1. Always Name Your Operations

```graphql
# ❌ Bad
query {
  myTasks {
    title
  }
}

# ✅ Good
query GetMyTasks {
  myTasks {
    title
  }
}
```

### 2. Use Variables for Dynamic Values

```graphql
# ❌ Bad
mutation {
  createTask(input: { title: "Hardcoded" }) {
    id
  }
}

# ✅ Good
mutation CreateTask($input: CreateTaskInput!) {
  createTask(input: $input) {
    id
  }
}
```

### 3. Request Only What You Need

```graphql
# ❌ Bad (over-fetching)
query {
  users {
    id
    name
    email
    createdAt
    updatedAt
    tasks {
      id
      title
      description
      completed
      createdAt
      updatedAt
    }
  }
}

# ✅ Good
query {
  users {
    name
    tasks {
      title
    }
  }
}
```

---

## 🎯 Common Patterns

### Create and Refetch

```typescript
// Frontend: Apollo Client
const [createTask] = useMutation(CREATE_TASK, {
  refetchQueries: ["GetMyTasks"],
});
```

### Optimistic Updates

```typescript
const [toggleTask] = useMutation(TOGGLE_TASK, {
  optimisticResponse: {
    toggleTaskComplete: {
      __typename: "Task",
      id: taskId,
      completed: !currentCompleted,
    },
  },
});
```

---

**Keep this cheat sheet handy while developing! 🚀**

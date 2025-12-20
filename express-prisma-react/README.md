# 🎓 GraphQL Learning Project - User & Task Management System

## ✅ **PROJECT IS COMPLETE AND RUNNING!**

**Backend:** 🟢 Running on `http://localhost:4000/graphql`  
**Frontend:** 🟢 Running on `http://localhost:5173`

---

## 📚 **What You'll Learn (20 Topics)**

### **BASIC Level (Topics 1-8)**

1. ✅ **GraphQL vs REST** - Problem vs Solution
2. ✅ **Queries** - Reading data
3. ✅ **Mutations** - Writing data
4. ✅ **Schema & Type Definitions** - The API contract
5. ✅ **Scalars & Custom Types** - Data types
6. ✅ **Arguments** - Passing parameters
7. ✅ **Resolvers** - Connecting schema to logic
8. ✅ **GraphQL Playground** - Testing our API

### **INTERMEDIATE Level (Topics 9-20)**

9. ✅ **Input Types** - Clean mutation arguments
10. ✅ **Relationships (Prisma)** - User → Tasks (One-to-Many)
11. ✅ **Pagination** - Offset & Cursor-based
12. ✅ **Authentication (JWT)** - Securing the API
13. ✅ **Authorization** - Protected resolvers
14. ✅ **Error Handling** - Custom GraphQL errors
15. ✅ **Context** - Sharing auth state
16. ✅ **Environment Variables** - Secure configuration
17. ✅ **N+1 Problem** - Performance optimization awareness
18. ✅ **Schema Design Best Practices** - Professional patterns
19. ✅ **Frontend Queries & Mutations** - React + Apollo Client
20. ✅ **Apollo Client Cache** - State management basics

---

## 🛠 **Tech Stack**

| Layer              | Technology                                |
| ------------------ | ----------------------------------------- |
| **Frontend**       | React 18, TypeScript, Apollo Client, Vite |
| **Backend**        | Node.js, Express.js, Apollo Server 4      |
| **Database**       | SQLite (via Prisma ORM)                   |
| **Authentication** | JWT + bcryptjs                            |
| **API**            | GraphQL                                   |

---

## 🚀 **Quick Start (Both Servers Running)**

### **Option 1: Use the Web Application**

1. **Open your browser:** `http://localhost:5173`
2. **Register an account** (name, email, password)
3. **Create tasks** and manage them
4. **Test features:**
   - Create tasks
   - Mark as complete
   - Edit tasks
   - Delete tasks
   - Logout/Login

### **Option 2: Test GraphQL API Directly**

1. **Open Apollo Sandbox:** `http://localhost:4000/graphql`
2. **Try example queries/mutations:**

**Register:**

```graphql
mutation {
  register(
    input: {
      name: "John Doe"
      email: "john@example.com"
      password: "password123"
    }
  ) {
    token
    user {
      id
      name
    }
  }
}
```

**Copy the token, then add to HTTP Headers:**

```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Create a Task:**

```graphql
mutation {
  createTask(
    input: { title: "Learn GraphQL", description: "Master all 20 topics" }
  ) {
    id
    title
    completed
  }
}
```

**Get Your Tasks:**

```graphql
query {
  myTasks {
    id
    title
    completed
    createdAt
  }
}
```

---

## 📂 **Project Structure**

```
express-prisma-react/
│
├── server/                          # Backend GraphQL API
│   ├── prisma/
│   │   ├── schema.prisma           # Database models
│   │   ├── dev.db                  # SQLite database file
│   │   └── migrations/             # Database migration history
│   │
│   ├── src/
│   │   ├── index.js                # 🚀 Server entry point
│   │   ├── typeDefs.js             # GraphQL Schema (Types, Queries, Mutations)
│   │   ├── resolvers.js            # Resolver functions (business logic)
│   │   ├── db.js                   # Prisma Client instance
│   │   └── utils/
│   │       ├── auth.js             # JWT generation/verification
│   │       └── errors.js           # Custom GraphQL error classes
│   │
│   ├── .env                        # Environment variables
│   ├── .env.example                # Template for .env
│   └── package.json
│
├── frontend/                        # React Frontend
│   ├── src/
│   │   ├── apollo/
│   │   │   ├── client.ts           # Apollo Client setup with auth
│   │   │   └── queries.ts          # All GraphQL queries/mutations
│   │   │
│   │   ├── components/
│   │   │   ├── Auth.tsx            # Login/Register component
│   │   │   ├── Auth.css
│   │   │   ├── Dashboard.tsx       # Task management dashboard
│   │   │   └── Dashboard.css
│   │   │
│   │   ├── App.tsx                 # Main app component
│   │   ├── App.css
│   │   └── main.tsx                # Entry point
│   │
│   └── package.json
│
├── README.md                        # This file
├── QUICK_START.md                   # Quick start guide
├── LEARNING_NOTES.md                # Topics 1-10 (Detailed)
└── LEARNING_NOTES_PART2.md          # Topics 11-20 (Detailed)
```

---

## 📖 **Database Schema**

### **User Model**

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String   # Hashed with bcryptjs
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tasks     Task[]   # One-to-Many relationship
}
```

### **Task Model**

```prisma
model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      String   # Foreign key
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Relationship:** One User → Many Tasks

---

## 🔐 **Authentication Flow**

```
1. User registers/logs in
   ↓
2. Server validates credentials
   ↓
3. Server generates JWT token (contains userId)
   ↓
4. Frontend stores token in localStorage
   ↓
5. Every GraphQL request includes: Authorization: Bearer <token>
   ↓
6. Server verifies token in context function
   ↓
7. If valid, context.user contains authenticated user
   ↓
8. Resolvers can access context.user
```

---

## 🎮 **GraphQL Features Demonstrated**

### **Queries (Read Operations)**

```graphql
query {
  me {
    id
    name
    email
  } # Get current user
  myTasks {
    id
    title
    completed
  } # Get user's tasks
  task(id: "123") {
    title
  } # Get single task
  # Pagination (Cursor-based)
  tasksCursor(first: 10, after: "cursor") {
    edges {
      node {
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
    }
  }
}
```

### **Mutations (Write Operations)**

```graphql
mutation {
  # Authentication
  register(input: { name, email, password }) { token user }
  login(input: { email, password }) { token user }

  # Task Management
  createTask(input: { title, description }) { id title }
  updateTask(id: "123", input: { title: "Updated" }) { id }
  deleteTask(id: "123") { id }
  toggleTaskComplete(id: "123") { id completed }
}
```

### **Input Types**

```graphql
input RegisterInput {
  name: String!
  email: String!
  password: String!
}

input CreateTaskInput {
  title: String!
  description: String
}
```

### **Custom Error Handling**

```javascript
throw new AuthenticationError("You must be logged in");
throw new ValidationError("Password too short");
throw new NotFoundError("Task not found");
throw new ForbiddenError("Not authorized");
```

---

## 🔧 **How to Restart/Stop**

### **Stop Servers**

- Press `Ctrl+C` in both terminal windows

### **Restart Backend**

```bash
cd server
npm start
```

### **Restart Frontend**

```bash
cd frontend
npm run dev
```

### **Reset Database**

```bash
cd server
rm prisma/dev.db
npx prisma migrate deploy
npm start
```

---

## 📝 **Learning Path**

### **Step 1: Understand the Basics (Topics 1-8)**

- Read `LEARNING_NOTES.md`
- Test queries in Apollo Sandbox
- Understand the schema in `server/src/typeDefs.js`

### **Step 2: Study Intermediate Concepts (Topics 9-20)**

- Read `LEARNING_NOTES_PART2.md`
- Explore authentication flow
- Test pagination queries
- Study the frontend code

### **Step 3: Experiment**

- Add new features
- Create new types
- Implement subscriptions (real-time)
- Deploy to production

---

## 🎯 **Common Tasks**

### **Add a New Field to User**

1. Update `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields
  bio String?
}
```

2. Run migration:

```bash
npx prisma migrate dev --name add_bio_to_user
```

3. Update GraphQL schema (typeDefs.js):

```graphql
type User {
  # ... existing fields
  bio: String
}
```

4. Test in Apollo Sandbox!

### **Add a New Mutation**

1. Add to `typeDefs.js`:

```graphql
type Mutation {
  deleteAllTasks: Int! # Returns count deleted
}
```

2. Add resolver in `resolvers.js`:

```javascript
Mutation: {
  deleteAllTasks: async (_, __, context) => {
    const user = requireAuth(context);
    const result = await prisma.task.deleteMany({
      where: { userId: user.id },
    });
    return result.count;
  };
}
```

---

## 🚀 **Next Steps (Advanced)**

1. **Add GraphQL Subscriptions** (Real-time updates)
2. **Implement DataLoader** (Fully solve N+1 problem)
3. **Add File Uploads** (Profile pictures)
4. **Deploy to Production:**
   - Frontend: Vercel
   - Backend: Railway
   - Database: PostgreSQL (Supabase)
5. **Add Roles & Permissions** (Admin, User, Guest)
6. **Implement Refresh Tokens** (Better security)
7. **Add Testing** (Jest + Apollo Testing Tools)

---

## 📚 **Documentation Files**

| File                      | Purpose                                 |
| ------------------------- | --------------------------------------- |
| `README.md`               | This file - Project overview            |
| `QUICK_START.md`          | How to run the project                  |
| `LEARNING_NOTES.md`       | Topics 1-10 with detailed explanations  |
| `LEARNING_NOTES_PART2.md` | Topics 11-20 with detailed explanations |

---

## 💡 **Key Takeaways**

✅ GraphQL solves over/under-fetching problems  
✅ Schema is your API contract (type-safe)  
✅ Resolvers connect schema to data sources  
✅ Context shares request-scoped data (auth user)  
✅ Input Types keep mutations clean  
✅ Cursor pagination for production apps  
✅ Custom errors improve debugging  
✅ Apollo Client automatically caches queries

---

## 🏆 **Congratulations!**

You now have a **complete, production-style GraphQL application** covering all fundamental and intermediate concepts!

**What you've built:**

- ✅ Full-stack GraphQL app
- ✅ JWT authentication
- ✅ Authorization & ownership checks
- ✅ Pagination (both types)
- ✅ Error handling
- ✅ One-to-Many relationships
- ✅ React frontend with Apollo Client

**Keep learning:**

- GraphQL Official Docs: https://graphql.org/learn/
- Apollo Server Docs: https://www.apollographql.com/docs/apollo-server/
- Prisma Docs: https://www.prisma.io/docs/

---

**Happy Coding! 🚀**

---

_Built with ❤️ for learning GraphQL_

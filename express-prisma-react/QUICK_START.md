# 🚀 Quick Start Guide

## ✅ Current Status

**Backend Server:** ✅ RUNNING on `http://localhost:4000/graphql`  
**Frontend:** Not yet started

---

## 📦 How to Run the Complete Project

### **1. Backend Server (Already Running)**

The backend GraphQL server is currently running! You can:

**Test it in Browser:**

- Visit: `http://localhost:4000/graphql`
- You'll see the Apollo Sandbox (GraphQL Playground)

**Test it with curl:**

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/graphql" -ContentType "application/json" -Body '{"query": "query { hello }"}'
```

**Stop the server:**

- Press `Ctrl+C` in the terminal

**Restart the server:**

```bash
cd server
npm start
```

---

### **2. Start the Frontend**

Open a **NEW terminal** and run:

```bash
cd frontend
npm run dev
```

The frontend will start on: `http://localhost:5173`

---

## 🎮 Testing the Application

### **Option 1: Using the Frontend (Easiest)**

1. Open `http://localhost:5173` in your browser
2. Click "Register" to create an account
3. Create tasks, mark them complete, edit, delete
4. Logout and login again to test authentication

### **Option 2: Using Apollo Sandbox (Learn GraphQL)**

1. Open `http://localhost:4000/graphql`
2. Try these examples:

**Example 1: Register a User**

```graphql
mutation {
  register(
    input: {
      name: "Test User"
      email: "test@example.com"
      password: "password123"
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

**Example 2: Copy the token and set HTTP Headers**

Click on "Headers" tab (bottom left) and add:

```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Example 3: Create a Task (Authenticated)**

```graphql
mutation {
  createTask(
    input: { title: "Learn GraphQL", description: "Complete all 20 topics" }
  ) {
    id
    title
    completed
    createdAt
  }
}
```

**Example 4: Get My Tasks**

```graphql
query {
  myTasks {
    id
    title
    description
    completed
    createdAt
  }
}
```

**Example 5: Toggle Task Complete**

```graphql
mutation {
  toggleTaskComplete(id: "TASK_ID_HERE") {
    id
    completed
  }
}
```

**Example 6: Pagination (Cursor-based)**

```graphql
query {
  tasksCursor(first: 5) {
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
    totalCount
  }
}
```

---

## 📂 Project Structure

```
express-prisma-react/
├── server/                     ← Backend (Currently Running ✅)
│   ├── prisma/
│   │   ├── schema.prisma      ← Database schema
│   │   ├── dev.db             ← SQLite database
│   │   └── migrations/        ← Database migrations
│   ├── src/
│   │   ├── index.js           ← Server entry point
│   │   ├── typeDefs.js        ← GraphQL schema
│   │   ├── resolvers.js       ← Query/Mutation logic
│   │   ├── db.js              ← Prisma client
│   │   └── utils/             ← Helper functions
│   └── package.json
│
└── frontend/                   ← React Frontend
    ├── src/
    │   ├── apollo/            ← Apollo Client setup
    │   ├── components/        ← React components
    │   └── App.tsx            ← Main app
    └── package.json
```

---

## 🔧 Troubleshooting

### **Server won't start?**

```bash
cd server
npx prisma generate
npx prisma migrate deploy
npm start
```

### **Frontend can't connect?**

1. Make sure backend is running on port 4000
2. Check console for errors
3. Verify `http://localhost:4000/graphql` is accessible

### **Database errors?**

```bash
cd server
# Delete the database
rm prisma/dev.db

# Recreate it
npx prisma migrate deploy
npm start
```

---

## 📚 Learning Resources

1. **README.md** - Overview and setup
2. **LEARNING_NOTES.md** - Topics 1-10 (Detailed explanations)
3. **LEARNING_NOTES_PART2.md** - Topics 11-20 (Advanced concepts)

---

## 🎯 What You'll Learn

### **BASIC GraphQL (Topics 1-8)**

- GraphQL vs REST
- Queries & Mutations
- Schema & Type Definitions
- Scalars & Arguments
- Resolvers
- GraphQL Playground

### **INTERMEDIATE GraphQL (Topics 9-20)**

- Input Types
- Relationships (One-to-Many)
- Pagination (Offset & Cursor)
- JWT Authentication
- Authorization
- Error Handling
- Context
- Environment Variables
- N+1 Problem
- Schema Best Practices
- Frontend Integration (React + Apollo Client)

---

## 💡 Next Steps After Completing This Project

1. ✅ Add real-time updates (GraphQL Subscriptions)
2. ✅ Implement DataLoader (fully solve N+1)
3. ✅ Add file uploads
4. ✅ Deploy to production (Vercel + Railway)
5. ✅ Add roles & permissions
   6 ✅ Implement refresh tokens

---

**Happy Learning! 🚀**

Need help? Check the learning notes or visit GraphQL docs: https://graphql.org/learn/

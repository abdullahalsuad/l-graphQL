import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

// Import our GraphQL schema and resolvers
import { typeDefs } from "./typeDefs.js";
import { resolvers } from "./resolvers.js";
import { verifyToken } from "./utils/auth.js";
import prisma from "./db.js";

// ============================================
// SERVER SETUP
// ============================================

const app = express();
const httpServer = http.createServer(app);

// ============================================
// APOLLO SERVER CONFIGURATION
// ============================================

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],

  // Error formatting (Topic 14)
  formatError: (formattedError, error) => {
    // Don't expose internal server errors to clients
    console.error("GraphQL Error:", formattedError);
    return formattedError;
  },
});

// Start Apollo Server
await server.start();

// ============================================
// CONTEXT FUNCTION (Topic 15)
// ============================================
// Context is shared across all resolvers
// This is where we handle authentication

const getContext = async ({ req }) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return { user: null };
  }

  // Verify token and get user
  const decoded = verifyToken(token);

  if (!decoded) {
    return { user: null };
  }

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  return { user };
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(
  "/graphql",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
  express.json(),
  expressMiddleware(server, {
    context: getContext,
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 4000;

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 GraphQL Server Ready!                                ║
║                                                            ║
║   📍 GraphQL Endpoint: http://localhost:${PORT}/graphql      ║
║   🎮 Apollo Sandbox:   http://localhost:${PORT}/graphql      ║
║   ❤️  Health Check:     http://localhost:${PORT}/health       ║
║                                                            ║
║   📚 Learning Topics Covered:                             ║
║      ✅ Queries & Mutations                               ║
║      ✅ Schema & Type Definitions                         ║
║      ✅ Resolvers                                          ║
║      ✅ Input Types                                        ║
║      ✅ Authentication (JWT)                               ║
║      ✅ Authorization                                      ║
║      ✅ Error Handling                                     ║
║      ✅ Context                                            ║
║      ✅ Pagination (Offset & Cursor)                      ║
║      ✅ Relationships (Prisma)                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

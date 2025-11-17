import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import axios from "axios";

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs: `
    type Todo {
      id: ID!
      title: String!
      completed: Boolean
      user: User
    }

    type User {
            id: ID!
            name: String!
            username: String!
            email: String!
            phone: String!
            website: String!
    }

    type Query {
      getTodos: [Todo]
      getAllUsers: [User]
      getUser(id: ID!): User
    }
  `,
    resolvers: {
      Todo: {
        user: async (todo) =>
          (
            await axios.get(
              `https://jsonplaceholder.typicode.com/users/${todo.userId}`
            )
          ).data,
      },

      Query: {
        getTodos: async () =>
          (await axios.get("https://jsonplaceholder.typicode.com/todos")).data,

        getAllUsers: async () =>
          (await axios.get("https://jsonplaceholder.typicode.com/users")).data,

        getUser: async (_, { id }) =>
          (await axios.get(`https://jsonplaceholder.typicode.com/users/${id}`))
            .data,
      },
    },
  });

  await server.start();

  // Apply middleware
  app.use(cors());
  app.use(express.json());

  // Root route
  app.get("/", (req, res) => {
    res.json({
      status: "success",
      message: "🚀 Server is running ",
      apolloServer: "http://localhost:8000/graphql",
    });
  });

  app.use("/graphql", expressMiddleware(server));

  const PORT = 8000;

  app.listen(PORT, () =>
    console.log(`⚡ Server running at 👉 http://localhost:${PORT} 👈`)
  );
}

startServer();

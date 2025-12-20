import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// HTTP connection to the API
const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

// Middleware to attach JWT token to requests
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage
  const token = localStorage.getItem("token");

  // Return headers with authorization
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Create Apollo Client instance
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    // Cache configuration (Topic 20)
    typePolicies: {
      Query: {
        fields: {
          myTasks: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});

import { useState, useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { client } from "./apollo/client";
import { Auth } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    // Reset Apollo cache
    client.clearStore();
  };

  return (
    <ApolloProvider client={client}>
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Auth onSuccess={handleLoginSuccess} />
      )}
    </ApolloProvider>
  );
}

export default App;

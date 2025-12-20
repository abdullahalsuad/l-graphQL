import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { REGISTER_MUTATION, LOGIN_MUTATION } from "../apollo/queries";
import "./Auth.css";

interface AuthProps {
  onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [register, { loading: registerLoading, error: registerError }] =
    useMutation(REGISTER_MUTATION);
  const [login, { loading: loginLoading, error: loginError }] =
    useMutation(LOGIN_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const { data } = await login({
          variables: {
            input: {
              email: formData.email,
              password: formData.password,
            },
          },
        });

        if (data?.login?.token) {
          localStorage.setItem("token", data.login.token);
          localStorage.setItem("user", JSON.stringify(data.login.user));
          onSuccess();
        }
      } else {
        const { data } = await register({
          variables: {
            input: formData,
          },
        });

        if (data?.register?.token) {
          localStorage.setItem("token", data.register.token);
          localStorage.setItem("user", JSON.stringify(data.register.user));
          onSuccess();
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
    }
  };

  const loading = registerLoading || loginLoading;
  const error = registerError || loginError;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isLogin ? "Login" : "Register"}</h1>
        <p className="auth-subtitle">
          {isLogin ? "Welcome back!" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Enter your name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {error && (
            <div className="error-message">
              {error.message.replace("ApolloError: ", "")}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Loading..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="link-button">
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

import "./App.css";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const query = gql`
  query Query {
    getTodos {
      id
      title
      user {
        id
        name
      }
    }
  }
`;

const App = () => {
  const { data, loading } = useQuery(query);

  if (loading) return <h1>Loading........</h1>;
  console.log(data);

  const todos = data?.getTodos || [];

  return (
    <div>
      {todos.map((todo) => (
        <div key={todo.id}>
          <h4>
            <strong>ID:</strong> {todo?.id} <br />
            <strong>Title:</strong> {todo.title}
          </h4>

          <h2>User Details</h2>
          <hr />
          <p>
            <strong>User ID:</strong> {todo.user.id}
          </p>
          <p>
            <strong>Name:</strong> {todo.user.name}
          </p>
          <hr />
        </div>
      ))}
    </div>
  );
};

export default App;

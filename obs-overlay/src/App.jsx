import CompactTaskList from "./components/task/CompactTaskList";
import useTask from "./hooks/useTask";
import "./App.css";

function App() {
  const { tasks, loading, error, connected } = useTask();

  return (
    <div className="container">
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-indicator">Loading tasks...</div>}
      <CompactTaskList tasks={tasks} loading={loading} connected={connected} />
    </div>
  );
}

export default App;

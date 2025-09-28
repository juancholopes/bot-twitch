import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import styled, { createGlobalStyle } from "styled-components";
import CompactTaskList from "./components/task/CompactTaskList";

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    pointer-events: none;
  }

  body {
    margin: 0;
    padding: 0;
    background: transparent !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    pointer-events: none;
  }

  #root {
    width: 100vw;
    height: 100vh;
    background: transparent !important;
    pointer-events: none;
  }

  /* Remove all default backgrounds and ensure transparency */
  html, body, #root, div {
    background: transparent !important;
  }

  /* Interactive elements exception */
  .interactive {
    pointer-events: auto !important;
  }

  /* Ensure smooth animations without interaction */
  * {
    will-change: auto;
  }
`;

const Container = styled.div`
  width: 1920px;
  height: 1080px;
  background: transparent !important;
  position: relative;
  overflow: hidden;
  pointer-events: none;

  /* Ensure complete transparency for OBS */
  &::before,
  &::after {
    display: none;
  }
`;

const ErrorMessage = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 14px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
  z-index: 2000;
  animation: slideInFromTop 0.3s ease-out;

  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const LoadingIndicator = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 14px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
  z-index: 2000;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

const API_URL = "http://localhost:3000/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetchTasks();

    const socket = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      timeout: 5000,
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
      setConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err);
      setError("Connection failed. Retrying...");
    });

    socket.on("tasksUpdated", () => {
      console.log("Tasks updated, fetching new data...");
      fetchTasks();
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchTasks = async () => {
    try {
      setError(null);
      const response = await axios.get(API_URL, {
        timeout: 5000,
      });
      setTasks(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError("Failed to load tasks. Check server connection.");
      setLoading(false);
    }
  };

  // Auto-retry connection every 10 seconds if there's an error
  useEffect(() => {
    if (error && !loading) {
      const retryTimer = setTimeout(() => {
        console.log("Retrying connection...");
        fetchTasks();
      }, 10000);

      return () => clearTimeout(retryTimer);
    }
  }, [error, loading]);

  return (
    <>
      <GlobalStyle />
      <Container>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {loading && <LoadingIndicator>Loading tasks...</LoadingIndicator>}

        <CompactTaskList
          tasks={tasks}
          loading={loading}
          connected={connected}
        />
      </Container>
    </>
  );
}

export default App;

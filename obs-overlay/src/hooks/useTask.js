import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = "http://localhost:3000/api/tasks";

function useTask() {
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

  return { tasks, loading, error, connected };
}

export default useTask;

// Conection to manage tasks bot with REST API and WebSocket for real-time updates

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = "http://localhost:3000/api/tasks";
const SOCKET_URL = "http://localhost:3000";

function useTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(API_URL, {
        timeout: 5000,
      });

      // Verificar si la respuesta tiene el formato nuevo { success, data, count }
      if (response.data.success && response.data.data) {
        console.log(`📋 Tasks fetched: ${response.data.count} users`);
        setTasks(response.data.data);
      } else if (Array.isArray(response.data)) {
        // Formato antiguo (array directo)
        console.log(`📋 Tasks fetched: ${response.data.length} users`);
        setTasks(response.data);
      } else {
        console.warn("⚠️ Formato de respuesta inesperado:", response.data);
        setTasks([]);
      }

      setLoading(false);
    } catch (err) {
      console.error("❌ Failed to fetch tasks:", err);
      setError("Failed to load tasks. Check server connection.");
      setLoading(false);
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    // Fetch inicial de tareas
    fetchTasks();

    // Configurar WebSocket
    console.log("🔌 Initializing WebSocket connection to", SOCKET_URL);

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ WebSocket Connected:", socket.id);
      setConnected(true);
      setError(null);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket Disconnected. Reason:", reason);
      setConnected(false);

      // Si la desconexión fue por el servidor, intentar reconectar
      if (reason === "io server disconnect") {
        console.log("🔄 Server disconnected, attempting manual reconnect...");
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("⚠️ WebSocket connection error:", err.message);
      setError(`Connection error: ${err.message}`);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 WebSocket Reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      setError(null);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Reconnection attempt #${attemptNumber}...`);
    });

    socket.on("reconnect_error", (err) => {
      console.error("⚠️ Reconnection error:", err.message);
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ WebSocket reconnection failed");
      setError("Failed to reconnect to server");
    });

    socket.on("tasksUpdated", () => {
      console.log("🔄 Tasks updated event received, fetching new data...");
      fetchTasks();
    });

    socket.on("error", (err) => {
      console.error("❌ WebSocket error:", err);
    });

    // Cleanup on unmount
    return () => {
      console.log("🔌 Cleaning up WebSocket connection...");
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, [fetchTasks]); // Auto-retry connection every 10 seconds if there's an error
  useEffect(() => {
    if (error && !loading) {
      const retryTimer = setTimeout(() => {
        console.log("🔄 Retrying connection...");
        fetchTasks();
      }, 10000);

      return () => clearTimeout(retryTimer);
    }
  }, [error, loading, fetchTasks]);

  return { tasks, loading, error, connected };
}

export default useTask;

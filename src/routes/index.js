const express = require("express");
const router = express.Router();
const tasksRoutes = require("./tasks.routes");
const healthRoutes = require("./health.routes");

// Rutas de tareas
router.use("/tasks", tasksRoutes);

// Rutas de health check
router.use("/health", healthRoutes);

// Ruta raíz de la API
router.get("/", (req, res) => {
  res.json({
    message: "Bot Twitch API",
    version: "1.0.0",
    status: "online",
    timestamp: new Date().toISOString(),
    endpoints: {
      tasks: "/api/tasks",
      health: "/api/health",
    },
  });
});

module.exports = router;

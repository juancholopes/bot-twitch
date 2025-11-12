const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

// GET /api/tasks - Obtener todas las tareas
router.get("/", (req, res) => {
  try {
    const tasksPath = path.join(__dirname, "../../data/tasks.json");

    fs.readFile(tasksPath, "utf8", (err, data) => {
      if (err) {
        logger.error("Error leyendo archivo de tareas:", err);
        return res.status(500).json({
          success: false,
          error: "Error al leer las tareas",
        });
      }

      try {
        const tasks = JSON.parse(data);
        res.json({
          success: true,
          data: tasks,
          count: tasks.length,
        });
      } catch (parseErr) {
        logger.error("Error parseando JSON de tareas:", parseErr);
        res.status(500).json({
          success: false,
          error: "Error al procesar las tareas",
        });
      }
    });
  } catch (error) {
    logger.error("Error en endpoint de tareas:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
});

module.exports = router;

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const config = require("./config/environment");
const logger = require("./utils/logger");
const taskService = require("./services/taskService");
const apiRoutes = require("./routes");

class WebServer {
  constructor() {
    this.app = express();
    this.port = config.server.port;
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    taskService.setEmitter((event) => this.io.emit(event));
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocket();
  }

  setupMiddleware() {
    // Enable CORS for all routes
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Parse JSON bodies
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Ruta raíz
    this.app.get("/", (_req, res) => {
      res.json({
        message: "Bot de Twitch funcionando correctamente",
        timestamp: new Date().toISOString(),
        status: "online",
        endpoints: {
          api: "/api",
          health: "/api/health",
          tasks: "/api/tasks",
          overlay: "/overlay",
        },
      });
    });

    // Rutas de la API
    this.app.use("/api", apiRoutes);

    // Serve overlay static files
    this.app.use(
      "/overlay",
      express.static(path.join(__dirname, "../obs-overlay/dist"))
    );

    // Manejo de rutas no encontradas (404)
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: "Ruta no encontrada",
        path: req.path,
      });
    });

    // Manejo de errores global
    this.app.use((err, req, res, next) => {
      logger.error("Error en el servidor:", err);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    });
  }

  // Configure WebSocket
  setupSocket() {
    this.io.on("connection", (socket) => {
      logger.info(`✅ Cliente WebSocket conectado: ${socket.id}`);

      // Enviar el estado actual de las tareas al conectarse
      socket.emit("connected", {
        message: "Conectado al servidor",
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });

      // Manejar errores del socket
      socket.on("error", (error) => {
        logger.error(`❌ Error en socket ${socket.id}:`, error);
      });

      // Manejar desconexión
      socket.on("disconnect", (reason) => {
        logger.info(
          `❌ Cliente WebSocket desconectado: ${socket.id}, Razón: ${reason}`
        );
      });

      // Agregar un ping/pong para mantener la conexión activa
      socket.on("ping", () => {
        socket.emit("pong", { timestamp: Date.now() });
      });
    });

    // Log general de errores de Socket.IO
    this.io.engine.on("connection_error", (err) => {
      logger.error("❌ Socket.IO connection error:", err);
    });

    logger.info("📡 WebSocket configurado correctamente");
  }

  // Método para emitir eventos de WebSocket
  emit(event, data) {
    this.io.emit(event, data);
  }

  // Start the web server
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.port, "127.0.0.1", () => {
          logger.info(
            `🌐 Servidor web iniciado en http://127.0.0.1:${this.port}`
          );
          logger.info(`📡 WebSocket disponible en ws://127.0.0.1:${this.port}`);
          resolve();
        });
      } catch (error) {
        logger.error("Error iniciando servidor web:", error);
        reject(error);
      }
    });
  }

  // Stop the web server
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info("Servidor web detenido");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = WebServer;

const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const config = require("./config/environment");
const logger = require("./utils/logger");
const taskService = require("./services/taskService");
const spotifyRoutes = require("./routes/spotify.routes");

class WebServer {
	constructor() {
		this.app = express();
		this.port = config.server.port;
		this.server = http.createServer(this.app);
		this.io = socketIo(this.server);
		taskService.setEmitter((event) => this.io.emit(event));
		this.setupRoutes();
		this.setupSocket();
	}

	setupRoutes() {
		const allowedOrigins = config.cors.allowedOrigins
			? config.cors.allowedOrigins.split(",")
			: [];

		this.app.use(
			cors({
				origin: function (origin, callback) {
					if (!origin) return callback(null, true);

					if (config.env === "development") {
						return callback(null, true);
					}

					if (allowedOrigins.indexOf(origin) !== -1) {
						callback(null, true);
					} else {
						callback(new Error("Not allowed by CORS"));
					}
				},
				methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
				allowedHeaders: [
					"Origin",
					"X-Requested-With",
					"Content-Type",
					"Accept",
					"Authorization",
				],
				credentials: true,
			}),
		);

		// Spotify Routes
		this.app.use('/', spotifyRoutes);

		this.app.get("/", (_req, res) => {
			res.json({
				message: "Bot de Twitch funcionando correctamente",
				timestamp: new Date().toISOString(),
				status: "online",
			});
		});

		this.app.get("/health", (_req, res) => {
			res.json({
				status: "healthy",
				uptime: process.uptime(),
				timestamp: new Date().toISOString(),
			});
		});

		this.app.get("/api/tasks", (_req, res) => {
			const fs = require("fs");
			const path = require("path");
			const tasksPath = path.join(__dirname, "../data/tasks.json");
			fs.readFile(tasksPath, "utf8", (err, data) => {
				if (err) {
					res.status(500).json({ error: "Failed to read tasks data" });
				} else {
					res.json(JSON.parse(data));
				}
			});
		});

		// Serve overlay static files
		this.app.use("/overlay", express.static(path.join(__dirname, "../obs-overlay/dist")));
	}

	setupSocket() {
		this.io.on('connection', (socket) => {
			logger.info('Client connected to WebSocket');
			socket.on('disconnect', () => {
				logger.info('Client disconnected from WebSocket');
			});
		});
	}

	start() {
		return new Promise((resolve, reject) => {
			try {
				this.server.listen(this.port, () => {
					logger.info(`Servidor web iniciado en http://localhost:${this.port}`);
					resolve();
				});
			} catch (error) {
				logger.error("Error iniciando servidor web:", error);
				reject(error);
			}
		});
	}

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

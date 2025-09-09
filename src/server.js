const express = require("express");
const config = require("./config/environment");
const logger = require("./utils/logger");

class WebServer {
	constructor() {
		this.app = express();
		this.port = config.server.port;
		this.setupRoutes();
	}

	setupRoutes() {
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
	}

	start() {
		return new Promise((resolve, reject) => {
			try {
				this.server = this.app.listen(this.port, () => {
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

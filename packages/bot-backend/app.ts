import TwitchBot from "./src/bot";
import WebServer from "./src/server";
import logger from "./src/infrastructure/logging/logger";

class Application {
	private bot: TwitchBot;
	private server: WebServer;

	constructor() {
		this.bot = new TwitchBot();
		this.server = new WebServer();
		this.setupGracefulShutdown();
	}

	async start(): Promise<void> {
		try {
			logger.info("Starting application...");

			// Iniciar servidor web
			await this.server.start();

			// Conectar bot de Twitch
			await this.bot.connect();

			logger.info("Application started successfully.");
		} catch (error) {
			logger.error("Failed to start application:", error);
			process.exit(1);
		}
	}

	async stop(): Promise<void> {
		try {
			logger.info("Stopping application...");

			await this.bot.disconnect();
			await this.server.stop();

			logger.info("Application stopped cleanly.");
		} catch (error) {
			logger.error("Failed to stop application:", error);
		}
	}

	private setupGracefulShutdown(): void {
		const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];

		signals.forEach((signal) => {
			process.on(signal, async () => {
				logger.info(`${signal} received, shutting down gracefully...`);
				await this.stop();
				process.exit(0);
			});
		});

		process.on("uncaughtException", (error) => {
			logger.error("Uncaught exception:", error);
			process.exit(1);
		});

		process.on("unhandledRejection", (reason, promise) => {
			logger.error("Unhandled promise rejection:", { reason, promise });
			process.exit(1);
		});
	}
}

// Iniciar aplicación solo si este archivo es ejecutado directamente
import { fileURLToPath } from 'node:url';
const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
	const app = new Application();
	app.start();
}

export default Application;

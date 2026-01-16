import TwitchBot from "./src/bot";
import WebServer from "./src/server";
import logger from "./src/utils/logger";

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
			logger.info("Iniciando aplicación...");

			// Iniciar servidor web
			await this.server.start();

			// Conectar bot de Twitch
			await this.bot.connect();

			logger.info("🟢🟢🟢 Aplicación iniciada correctamente 🛰️");
		} catch (error) {
			logger.error("Error iniciando la aplicación:", error);
			process.exit(1);
		}
	}

	async stop(): Promise<void> {
		try {
			logger.info("Deteniendo aplicación...");

			await this.bot.disconnect();
			await this.server.stop();

			logger.info("Aplicación detenida correctamente");
		} catch (error) {
			logger.error("Error deteniendo la aplicación:", error);
		}
	}

	private setupGracefulShutdown(): void {
		const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];

		signals.forEach((signal) => {
			process.on(signal, async () => {
				logger.info(`Señal ${signal} recibida, cerrando aplicación...`);
				await this.stop();
				process.exit(0);
			});
		});

		process.on("uncaughtException", (error) => {
			logger.error("Excepción no capturada:", error);
			process.exit(1);
		});

		process.on("unhandledRejection", (reason, promise) => {
			logger.error("Promesa rechazada no manejada:", { reason, promise });
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

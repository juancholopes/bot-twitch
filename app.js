const TwitchBot = require("./src/bot");
const WebServer = require("./src/server");
const logger = require("./src/utils/logger");

class Application {
  constructor() {
    this.bot = new TwitchBot();
    this.server = new WebServer();
    this.setupGracefulShutdown();
  }

  async start() {
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

  async stop() {
    try {
      logger.info("Deteniendo aplicación...");

      await this.bot.disconnect();
      await this.server.stop();

      logger.info("Aplicación detenida correctamente");
    } catch (error) {
      logger.error("Error deteniendo la aplicación:", error);
    }
  }

  setupGracefulShutdown() {
    const signals = ["SIGTERM", "SIGINT"];

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
if (require.main === module) {
  const app = new Application();
  app.start();
}

module.exports = Application;

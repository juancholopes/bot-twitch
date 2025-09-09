const tmi = require("tmi.js");
const config = require("./config/environment");
const logger = require("./utils/logger");

class TwitchBot {
	constructor() {
		this.client = new tmi.Client({
			options: { debug: true },
			identity: {
				username: config.twitch.username,
				password: config.twitch.oauthToken,
			},
			channels: [config.twitch.channelName],
		});

		this.setupEventHandlers();
	}

	setupEventHandlers() {
		this.client.on("connected", (address, port) => {
			logger.info(`Bot conectado a ${address}:${port}`);
		});

		this.client.on("message", this.handleMessage.bind(this));
	}

	async handleMessage(channel, tags, message, self) {
		if (self) return;

		const msg = message.trim();
		const commandHandlers = require("./commands");

		try {
			// Comando !mytasks o !list
			if (msg.toLowerCase() === "!mytasks" || msg.toLowerCase() === "!list") {
				await commandHandlers.mytasks(this.client, channel, tags);
			}
			// Comando !task (help)
			else if (msg.toLowerCase() === "!task") {
				await commandHandlers.task_help(this.client, channel, tags);
			}
			// Comando !task con tareas
			else if (msg.toLowerCase().startsWith("!task ")) {
				const tasks = msg.slice(6);
				await commandHandlers.task(this.client, channel, tags, tasks);
			}
			// Comando !done
			else if (msg.toLowerCase().startsWith("!done ")) {
				const taskNumbers = msg.slice(6).trim();
				await commandHandlers.done(this.client, channel, tags, taskNumbers);
			}
			// Comando !cleardone
			else if (msg.toLowerCase() === "!cleardone") {
				await commandHandlers.cleardone(this.client, channel, tags);
			}
			// Comando !delete
			else if (msg.toLowerCase() === "!delete") {
				await commandHandlers.delete(this.client, channel, tags);
			}
			// Comando !hello
			else if (msg.toLowerCase() === "!hello") {
				await commandHandlers.hello(this.client, channel, tags);
			}
			// Comando !help o !help <comando>
			else if (msg.toLowerCase() === "!help") {
				await commandHandlers.help(this.client, channel, tags);
			} else if (msg.toLowerCase().startsWith("!help ")) {
				const params = msg.slice(6); // 6 = longitud de "!help "
				await commandHandlers.help(this.client, channel, tags, params);
			}
		} catch (error) {
			logger.error("Error procesando mensaje:", error);
		}
	}

	async connect() {
		try {
			await this.client.connect();
			logger.info("Bot de Twitch iniciado correctamente");
		} catch (error) {
			logger.error("Error conectando el bot:", error);
			throw error;
		}
	}

	async disconnect() {
		try {
			await this.client.disconnect();
			logger.info("Bot desconectado");
		} catch (error) {
			logger.error("Error desconectando el bot:", error);
		}
	}
}

module.exports = TwitchBot;

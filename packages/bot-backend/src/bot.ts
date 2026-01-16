import tmi, { type ChatUserstate, type Client } from 'tmi.js';
import config from '@infrastructure/config/environment';
import logger from '@infrastructure/logging/logger';
import { limiters } from '@infrastructure/rate-limiting/rateLimiter';
import * as taskManagement from '@features/task-management';
import * as botCommands from '@shared/bot-commands';

class TwitchBot {
	private client: Client;

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

	private setupEventHandlers(): void {
		this.client.on('connected', (address: string, port: number) => {
			logger.info(`Bot conectado a ${address}:${port}`);
		});

		this.client.on('message', this.handleMessage.bind(this));
	}

	private async handleMessage(
		channel: string,
		tags: ChatUserstate,
		message: string,
		self: boolean,
	): Promise<void> {
		if (self) return;

		const msg = message.trim();

		// Ignorar mensajes que no inician con !
		if (!msg.startsWith('!')) return;

		// Check username exists
		if (!tags.username) return;

		// Rate Limiting
		if (!limiters.default.checkLimit(tags.username)) {
			// Silenciosamente ignorar o loguear
			logger.warn(`Rate limit exceeded for user: ${tags.username}`);
			return;
		}

		try {
			// Comando !mytasks o !list
			if (
				msg.toLowerCase() === '!mytasks' ||
				msg.toLowerCase() === '!list'
			) {
				await taskManagement.handleMyTasks(
					this.client,
					channel,
					tags,
				);
			}
			// Comando !task (help)
			else if (msg.toLowerCase() === '!task') {
				await taskManagement.handleTaskHelp(
					this.client,
					channel,
					tags,
				);
			}
			// Comando !task con tareas
			else if (msg.toLowerCase().startsWith('!task ')) {
				const tasks = msg.slice(6);
				await taskManagement.handleAddTask(
					this.client,
					channel,
					tags,
					tasks,
				);
			}
			// Comando !done
			else if (msg.toLowerCase().startsWith('!done ')) {
				const taskNumbers = msg.slice(6).trim();
				await taskManagement.handleDoneTask(
					this.client,
					channel,
					tags,
					taskNumbers,
				);
			}
			// Comando !cleardone
			else if (msg.toLowerCase() === '!cleardone') {
				await taskManagement.handleClearDone(
					this.client,
					channel,
					tags,
				);
			}
			// Comando !delete
			else if (msg.toLowerCase() === '!delete') {
				await taskManagement.handleDeleteAll(
					this.client,
					channel,
					tags,
				);
			}
			// Comando !hello
			else if (msg.toLowerCase() === '!hello') {
				await botCommands.handleHello(this.client, channel, tags);
			}
			// Comando !help o !help <comando>
			else if (msg.toLowerCase() === '!help') {
				await botCommands.handleHelp(this.client, channel, tags);
			} else if (msg.toLowerCase().startsWith('!help ')) {
				const params = msg.slice(6); // 6 = longitud de "!help "
				await botCommands.handleHelp(
					this.client,
					channel,
					tags,
					params,
				);
			}
		} catch (error) {
			logger.error('Error procesando mensaje:', error);
		}
	}

	async connect(): Promise<void> {
		try {
			await this.client.connect();
			logger.info('Bot de Twitch iniciado correctamente');
		} catch (error) {
			logger.error('Error conectando el bot:', error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		try {
			await this.client.disconnect();
			logger.info('Bot desconectado');
		} catch (error) {
			logger.error('Error desconectando el bot:', error);
		}
	}
}

export default TwitchBot;

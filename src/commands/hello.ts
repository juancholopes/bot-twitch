import type { ChatUserstate, Client } from 'tmi.js';
import logger from '../utils/logger';

export const handleHello = async (
	client: Client,
	channel: string,
	tags: ChatUserstate,
): Promise<void> => {
	try {
		await client.say(channel, `Hello world @${tags.username}!!!`);
		logger.info(`Usuario ${tags.username} ejecutó comando hello`);
	} catch (error) {
		logger.error('Error en comando hello:', error);
	}
};

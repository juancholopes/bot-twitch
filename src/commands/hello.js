const logger = require('../utils/logger');

const handleHello = async (client, channel, tags) => {
	try {
		await client.say(channel, `Hello world @${tags.username}!!!`);
		logger.info(`Usuario ${tags.username} ejecutó comando hello`);
	} catch (error) {
		logger.error('Error en comando hello:', error);
	}
};

module.exports = { handleHello };

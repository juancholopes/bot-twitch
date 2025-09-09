const logger = {
	info: (message, data = null) => {
		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] INFO: ${message}`, data ? data : "");
	},

	error: (message, error = null) => {
		const timestamp = new Date().toISOString();
		console.error(`[${timestamp}] ERROR: ${message}`, error ? error : "");
	},

	warn: (message, data = null) => {
		const timestamp = new Date().toISOString();
		console.warn(`[${timestamp}] WARN: ${message}`, data ? data : "");
	},

	debug: (message, data = null) => {
		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] DEBUG: ${message}`, data ? data : "");
	},
};

module.exports = logger;

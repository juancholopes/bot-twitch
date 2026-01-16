interface Logger {
	info: (message: string, data?: unknown) => void;
	error: (message: string, error?: unknown) => void;
	warn: (message: string, data?: unknown) => void;
	debug: (message: string, data?: unknown) => void;
}

const logger: Logger = {
	info: (message: string, data: unknown = null) => {
		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] INFO: ${message}`, data ? data : '');
	},

	error: (message: string, error: unknown = null) => {
		const timestamp = new Date().toISOString();
		console.error(`[${timestamp}] ERROR: ${message}`, error ? error : '');
	},

	warn: (message: string, data: unknown = null) => {
		const timestamp = new Date().toISOString();
		console.warn(`[${timestamp}] WARN: ${message}`, data ? data : '');
	},

	debug: (message: string, data: unknown = null) => {
		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] DEBUG: ${message}`, data ? data : '');
	},
};

export default logger;

interface Logger {
	info: (message: string, data?: any) => void;
	error: (message: string, error?: any) => void;
	warn: (message: string, data?: any) => void;
	debug: (message: string, data?: any) => void;
}

const logger: Logger = {
	info: (message: string, data: any = null) => {
		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] INFO: ${message}`, data ? data : "");
	},

	error: (message: string, error: any = null) => {
		const timestamp = new Date().toISOString();
		console.error(`[${timestamp}] ERROR: ${message}`, error ? error : "");
	},

	warn: (message: string, data: any = null) => {
		const timestamp = new Date().toISOString();
		console.warn(`[${timestamp}] WARN: ${message}`, data ? data : "");
	},

	debug: (message: string, data: any = null) => {
		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] DEBUG: ${message}`, data ? data : "");
	},
};

export default logger;

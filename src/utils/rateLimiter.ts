import config from '../config/environment';
import logger from './logger';

interface RateLimiterOptions {
	maxRequests?: number;
	windowMs?: number;
}

class RateLimiter {
	private maxRequests: number;
	private windowMs: number;
	private requests: Map<string, number[]>; // Map<username, timestamps[]>

	constructor(options: RateLimiterOptions = {}) {
		this.maxRequests = options.maxRequests || 5;
		this.windowMs = options.windowMs || 10000;
		this.requests = new Map<string, number[]>();

		// Clean up interval every minute
		setInterval(() => this.cleanup(), 60000).unref(); // unref so it doesn't block process exit
	}

	/**
	 * Check if a user can make a request
	 * @param username
	 * @returns true if allowed, false if limited
	 */
	checkLimit(username: string): boolean {
		if (!username) return true;

		const now = Date.now();
		const userRequests = this.requests.get(username) || [];

		// Filter requests within the window
		const recentRequests = userRequests.filter(
			(time) => now - time < this.windowMs,
		);

		if (recentRequests.length >= this.maxRequests) {
			logger.warn(`Rate limit exceeded for user: ${username}`);
			return false;
		}

		recentRequests.push(now);
		this.requests.set(username, recentRequests);
		return true;
	}

	cleanup(): void {
		const now = Date.now();
		for (const [username, timestamps] of this.requests.entries()) {
			const validTimestamps = timestamps.filter(
				(time) => now - time < this.windowMs,
			);
			if (validTimestamps.length === 0) {
				this.requests.delete(username);
			} else {
				this.requests.set(username, validTimestamps);
			}
		}
	}
}

// Instantiate limiters based on config
const limiters = {
	default: new RateLimiter({
		maxRequests: config.rateLimit.default.max,
		windowMs: config.rateLimit.default.windowMs,
	}),
	heavy: new RateLimiter({
		maxRequests: config.rateLimit.heavy.max,
		windowMs: config.rateLimit.heavy.windowMs,
	}),
};

export { RateLimiter, limiters };

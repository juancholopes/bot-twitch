jest.mock('../logger', () => ({
	default: {
		warn: jest.fn(),
	},
}));

// Mock config BEFORE importing RateLimiter - use correct path
jest.mock('../../config/environment', () => ({
	default: {
		rateLimit: {
			default: {
				max: 5,
				windowMs: 10000,
			},
			heavy: {
				max: 2,
				windowMs: 30000,
			},
		},
	},
}));

import { RateLimiter } from '../rateLimiter';

describe('RateLimiter', () => {
	let limiter: RateLimiter;

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test('should allow requests within limit', () => {
		limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

		expect(limiter.checkLimit('user1')).toBe(true);
		expect(limiter.checkLimit('user1')).toBe(true);
	});

	test('should block requests over limit', () => {
		limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });

		expect(limiter.checkLimit('user1')).toBe(true);
		expect(limiter.checkLimit('user1')).toBe(false);
	});

	test('should reset limit after window', () => {
		limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });

		expect(limiter.checkLimit('user1')).toBe(true);
		expect(limiter.checkLimit('user1')).toBe(false);

		// Advance time
		jest.advanceTimersByTime(1001);

		expect(limiter.checkLimit('user1')).toBe(true);
	});

	test('should track users independently', () => {
		limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });

		expect(limiter.checkLimit('user1')).toBe(true);
		expect(limiter.checkLimit('user2')).toBe(true);
	});

	test('cleanup should remove old entries', () => {
		limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });

		limiter.checkLimit('user1');
		expect((limiter as any).requests.has('user1')).toBe(true);

		jest.advanceTimersByTime(1001);
		(limiter as any).cleanup();

		expect((limiter as any).requests.has('user1')).toBe(false);
	});
});

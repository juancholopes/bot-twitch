const { RateLimiter } = require('../rateLimiter');

jest.mock('../logger', () => ({
  warn: jest.fn()
}));

describe('RateLimiter', () => {
  let limiter;

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
    expect(limiter.requests.has('user1')).toBe(true);

    jest.advanceTimersByTime(1001);
    limiter.cleanup();

    expect(limiter.requests.has('user1')).toBe(false);
  });
});

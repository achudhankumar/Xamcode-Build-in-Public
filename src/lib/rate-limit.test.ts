import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, clientKey, resetRateLimits } from './rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('allows requests under the limit', () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit('k', 5, 60_000, now + i).ok).toBe(true);
    }
  });

  it('blocks the request over the limit and reports retry time', () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) rateLimit('k', 5, 60_000, now + i);
    const blocked = rateLimit('k', 5, 60_000, now + 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('frees capacity once the window passes', () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) rateLimit('k', 5, 60_000, now + i);
    expect(rateLimit('k', 5, 60_000, now + 10).ok).toBe(false);
    // After the window, the oldest hits expire.
    expect(rateLimit('k', 5, 60_000, now + 61_000).ok).toBe(true);
  });

  it('keeps buckets separate per key', () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) rateLimit('a', 5, 60_000, now);
    expect(rateLimit('a', 5, 60_000, now).ok).toBe(false);
    expect(rateLimit('b', 5, 60_000, now).ok).toBe(true);
  });
});

describe('clientKey', () => {
  it('uses the first x-forwarded-for address when present', () => {
    const req = new Request('http://localhost/api', {
      headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' },
    });
    expect(clientKey(req, 'scope')).toBe('scope:1.2.3.4');
  });

  it('falls back to unknown without forwarded headers', () => {
    const req = new Request('http://localhost/api');
    expect(clientKey(req, 'scope')).toBe('scope:unknown');
  });
});

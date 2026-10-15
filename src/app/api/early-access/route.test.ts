import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from './route';
import { resetRateLimits } from '@/lib/rate-limit';

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/early-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/early-access', () => {
  beforeEach(() => {
    resetRateLimits();
  });
  it('rejects an invalid JSON body', async () => {
    const response = await POST(postRequest('{not json'));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors?.[0]?.type).toBe('VALIDATION');
  });

  it('rejects a missing email', async () => {
    const response = await POST(postRequest({ email: '', opted_in: true }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors?.[0]?.field).toBe('email');
  });

  it('rejects a malformed email', async () => {
    const response = await POST(postRequest({ email: 'nope', opted_in: true }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors?.[0]?.field).toBe('email');
  });

  it('rejects missing consent', async () => {
    const response = await POST(postRequest({ email: 'user@example.com', opted_in: false }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors?.[0]?.field).toBe('opted_in');
  });

  it('rejects an invalid interest value', async () => {
    const response = await POST(
      postRequest({ email: 'user@example.com', interest: 'bogus', opted_in: true }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors?.[0]?.field).toBe('interest');
  });

  it('rate-limits after 5 requests per minute', async () => {
    for (let i = 0; i < 5; i++) {
      await POST(postRequest({ email: 'a' + i + '@example.com', opted_in: true }));
    }
    const response = await POST(postRequest({ email: 'sixth@example.com', opted_in: true }));
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });

  it('passes validation but reports a server error when unconfigured', async () => {
    const response = await POST(postRequest({ email: 'user@example.com', opted_in: true }));
    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(response.status).toBeLessThan(600);
  });
});

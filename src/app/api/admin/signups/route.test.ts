import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';

const getCurrentUserMock = vi.fn();
const createServerClientMock = vi.fn();

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return {
    ...actual,
    getCurrentUser: () => getCurrentUserMock(),
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

function adminClient() {
  return {
    from: (table: string) => {
      if (table !== 'early_access_signups') throw new Error(`unexpected table ${table}`);
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: async () => ({ data: [{ id: '1', email: 'a@b.co' }], error: null }),
        update: () => chain,
        eq2: () => chain,
      };
      // PATCH path: update(...).eq(...) resolves like supabase does.
      return {
        select: () => chain,
        order: () => chain,
        limit: async () => ({ data: [{ id: '1', email: 'a@b.co' }], error: null }),
        update: () => ({ eq: async () => ({ data: [{ id: '1' }], error: null }) }),
      };
    },
  };
}

describe('GET /api/admin/signups (private waitlist)', () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    createServerClientMock.mockReset();
  });

  it('returns 401 when signed out — never leaks signup data', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const res = await GET(new Request('http://localhost/api/admin/signups'));
    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).not.toContain('@');
  });

  it('returns 403 for a regular member', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u1', role: 'member' });
    const res = await GET(new Request('http://localhost/api/admin/signups'));
    expect(res.status).toBe(403);
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it('returns 403 for a moderator (signups are admin-only)', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u2', role: 'moderator' });
    const res = await GET(new Request('http://localhost/api/admin/signups'));
    expect(res.status).toBe(403);
  });

  it('returns 503 when Supabase is not configured, even for admins', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u3', role: 'admin' });
    createServerClientMock.mockReturnValue(null);
    const res = await GET(new Request('http://localhost/api/admin/signups'));
    expect(res.status).toBe(503);
  });

  it('serves signups to an admin', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u3', role: 'admin' });
    createServerClientMock.mockReturnValue(adminClient());
    const res = await GET(new Request('http://localhost/api/admin/signups'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signups.length).toBe(1);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('PATCH /api/admin/signups', () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    createServerClientMock.mockReset();
  });

  it('rejects unauthenticated callers', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const res = await PATCH(
      new Request('http://localhost', { method: 'PATCH', body: '{}' }),
    );
    expect(res.status).toBe(401);
  });

  it('rejects invalid signup ids', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u3', role: 'admin' });
    createServerClientMock.mockReturnValue(adminClient());
    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'not-a-uuid', status: 'confirmed' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects invalid status values', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u3', role: 'admin' });
    createServerClientMock.mockReturnValue(adminClient());
    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ id: '00000000-0000-0000-0000-000000000001', status: 'hacked' }),
      }),
    );
    expect(res.status).toBe(400);
  });
});

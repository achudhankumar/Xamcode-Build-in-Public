import { describe, it, expect, vi, beforeEach } from 'vitest';

const getCurrentUserMock = vi.fn();

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return {
    ...actual,
    getCurrentUser: () => getCurrentUserMock(),
  };
});

import { requireRole, requireAdmin, requireModerator } from './guard';

function user(role: 'member' | 'moderator' | 'admin') {
  return {
    id: '00000000-0000-0000-0000-0000000000aa',
    email: 'x@example.com',
    role,
    display_name: null,
    username: null,
    avatar_url: null,
  };
}

describe('admin guards', () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
  });

  it('returns 401 when signed out', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const result = await requireAdmin();
    expect(result.response?.status).toBe(401);
    expect(result.user).toBeUndefined();
  });

  it('returns 403 when a member tries an admin route', async () => {
    getCurrentUserMock.mockResolvedValue(user('member'));
    const result = await requireAdmin();
    expect(result.response?.status).toBe(403);
  });

  it('returns 403 when a member tries a moderator route', async () => {
    getCurrentUserMock.mockResolvedValue(user('member'));
    const result = await requireModerator();
    expect(result.response?.status).toBe(403);
  });

  it('lets a moderator onto moderator routes but not admin routes', async () => {
    getCurrentUserMock.mockResolvedValue(user('moderator'));
    const mod = await requireModerator();
    expect(mod.response).toBeUndefined();
    expect(mod.user?.role).toBe('moderator');

    getCurrentUserMock.mockResolvedValue(user('moderator'));
    const admin = await requireAdmin();
    expect(admin.response?.status).toBe(403);
  });

  it('lets an admin anywhere', async () => {
    getCurrentUserMock.mockResolvedValue(user('admin'));
    const result = await requireRole('admin');
    expect(result.response).toBeUndefined();
    expect(result.user?.role).toBe('admin');
  });
});

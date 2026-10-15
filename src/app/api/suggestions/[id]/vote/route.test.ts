import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from './route';

const getCurrentUserMock = vi.fn();
const createServerClientMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

const SUGGESTION_ID = '00000000-0000-0000-0000-000000000001';
const params = Promise.resolve({ id: SUGGESTION_ID });

interface ChainResult {
  data: unknown;
  error: { code: string } | null;
}

/** Builds a minimal chainable Supabase-like client for the vote routes. */
function makeClient(options: {
  existingVote: boolean;
  insertError?: { code: string } | null;
  voteCount?: number;
}) {
  const state = { voteCount: options.voteCount ?? 1 };
  const client = {
    from(table: string) {
      if (table === 'suggestion_votes') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async (): Promise<ChainResult> => ({
                  data: options.existingVote ? { id: 'v1' } : null,
                  error: null,
                }),
              }),
            }),
          }),
          insert: async (): Promise<ChainResult> => ({
            data: null,
            error: options.insertError ?? null,
          }),
          delete: () => ({
            eq: () => ({ eq: async (): Promise<ChainResult> => ({ data: null, error: null }) }),
          }),
        };
      }
      if (table === 'suggestions') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async (): Promise<ChainResult> => ({
                data: { vote_count: state.voteCount },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
  return client;
}

describe('POST /api/suggestions/[id]/vote', () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    createServerClientMock.mockReset();
  });

  it('rejects an invalid suggestion id', async () => {
    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'nope' }) });
    expect(res.status).toBe(400);
  });

  it('returns 401 when signed out', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const res = await POST(new Request('http://localhost'), { params });
    expect(res.status).toBe(401);
  });

  it('returns 409 on a duplicate vote (existing row)', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u1', role: 'member' });
    createServerClientMock.mockReturnValue(makeClient({ existingVote: true }));
    const res = await POST(new Request('http://localhost'), { params });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already voted/i);
  });

  it('returns 409 when the insert hits the unique constraint (race)', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u1', role: 'member' });
    createServerClientMock.mockReturnValue(
      makeClient({ existingVote: false, insertError: { code: '23505' } }),
    );
    const res = await POST(new Request('http://localhost'), { params });
    expect(res.status).toBe(409);
  });

  it('records a fresh vote and returns the new count', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u1', role: 'member' });
    createServerClientMock.mockReturnValue(makeClient({ existingVote: false, voteCount: 7 }));
    const res = await POST(new Request('http://localhost'), { params });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.vote_count).toBe(7);
  });

  it('returns 500 on an unexpected insert failure', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u1', role: 'member' });
    createServerClientMock.mockReturnValue(
      makeClient({ existingVote: false, insertError: { code: 'XX000' } }),
    );
    const res = await POST(new Request('http://localhost'), { params });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/suggestions/[id]/vote', () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    createServerClientMock.mockReset();
  });

  it('returns 401 when signed out', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const res = await DELETE(new Request('http://localhost'), { params });
    expect(res.status).toBe(401);
  });

  it('removes the vote and returns the fresh count', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u1', role: 'member' });
    createServerClientMock.mockReturnValue(makeClient({ existingVote: true, voteCount: 4 }));
    const res = await DELETE(new Request('http://localhost'), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vote_count).toBe(4);
  });
});

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface CountRow {
  total: number;
}

async function countRows(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  table: string,
): Promise<number | null> {
  if (!supabase) return null;
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (error) return null;
  return count ?? 0;
}

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  const supabase = await createServerClient();

  const isAdmin = user?.role === 'admin';

  const [roadmap, discussions, suggestions, milestones, changelog, signups] = await Promise.all([
    countRows(supabase, 'roadmap_items'),
    countRows(supabase, 'discussions'),
    countRows(supabase, 'suggestions'),
    isAdmin ? countRows(supabase, 'progress_records') : Promise.resolve(undefined),
    isAdmin ? countRows(supabase, 'changelog_entries') : Promise.resolve(undefined),
    isAdmin ? countRows(supabase, 'early_access_signups') : Promise.resolve(undefined),
  ]);

  const cards: { label: string; value: number | null | undefined; href?: string }[] = [
    { label: 'Roadmap items', value: roadmap, href: '/admin/roadmap' },
    { label: 'Discussions', value: discussions, href: '/admin/moderation' },
    { label: 'Suggestions', value: suggestions, href: '/admin/moderation' },
  ];

  if (isAdmin) {
    cards.push(
      { label: 'Milestones', value: milestones, href: '/admin/milestones' },
      { label: 'Changelog entries', value: changelog, href: '/admin/changelog' },
      { label: 'Early-access signups', value: signups, href: '/admin/signups' },
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: '0 0 1rem' }}>
        Overview
      </h2>
      {!supabase && (
        <p style={{ padding: '1rem 1.25rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.5rem', color: '#f59e0b', fontSize: '0.875rem' }}>
          Supabase is not configured — admin data cannot be loaded. Set
          NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
        </p>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {cards.map((card) => (
          <li key={card.label}>
            <Link
              href={card.href ?? '#'}
              style={{ display: 'block', padding: '1.25rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', textDecoration: 'none' }}
            >
              <p style={{ margin: '0 0 0.375rem', fontSize: '0.8125rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.label}
              </p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#fafafa' }}>
                {card.value === null ? '—' : card.value === undefined ? '·' : card.value}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

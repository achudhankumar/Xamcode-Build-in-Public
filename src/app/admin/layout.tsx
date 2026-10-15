import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import SignOutButton from '@/components/layout/SignOutButton';

export const metadata = {
  title: 'Admin',
  description: 'Xamcode Build in Public administration.',
};

const NAV = [
  { href: '/admin', label: 'Overview', roles: ['admin', 'moderator'] },
  { href: '/admin/roadmap', label: 'Roadmap', roles: ['admin', 'moderator'] },
  { href: '/admin/milestones', label: 'Milestones', roles: ['admin'] },
  { href: '/admin/changelog', label: 'Changelog', roles: ['admin'] },
  { href: '/admin/moderation', label: 'Moderation', roles: ['admin', 'moderator'] },
  { href: '/admin/signups', label: 'Signups', roles: ['admin'] },
  { href: '/admin/roles', label: 'Roles', roles: ['admin'] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Middleware already redirects signed-out visitors; this catches any gap
  // and any signed-in user without staff privileges.
  if (!user) {
    redirect('/login?next=/admin');
  }
  if (user.role !== 'admin' && user.role !== 'moderator') {
    return (
      <div style={{ padding: '4rem 1.5rem', maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginBottom: '0.75rem' }}>
          Access denied
        </h1>
        <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Your account does not have staff privileges. If you believe this is a mistake, contact an
          administrator.
        </p>
        <Link href="/" style={{ color: '#93c5fd' }}>Back to home</Link>
      </div>
    );
  }

  const visibleNav = NAV.filter((item) => item.roles.includes(user.role));

  return (
    <div style={{ padding: '2rem 1.5rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fafafa', margin: 0 }}>Admin</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#71717a' }}>
            Signed in as {user.display_name || user.username || user.email} · {user.role}
          </p>
        </div>
        <SignOutButton />
      </header>

      <nav aria-label="Admin sections" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem', borderBottom: '1px solid #27272a', paddingBottom: '0.75rem' }}>
        {visibleNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{ padding: '0.375rem 0.875rem', fontSize: '0.875rem', fontWeight: 600, color: '#a1a1aa', textDecoration: 'none', borderRadius: '0.375rem' }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main>{children}</main>
    </div>
  );
}

import Link from 'next/link';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import SignOutButton from './SignOutButton';

const NAV = [
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/progress', label: 'Progress' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/community', label: 'Community' },
  { href: '/suggestions', label: 'Suggestions' },
  { href: '/early-access', label: 'Early Access' },
];

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-[#27272a]">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-[#fafafa] transition-colors hover:opacity-80"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#7c5cff] text-sm text-[#fafafa]">
            XB
          </span>
          <span>Xamcode Build in Public</span>
        </Link>

        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-[#d4d4d8]">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="transition-colors hover:text-[#fafafa]">
                {item.label}
              </Link>
            </li>
          ))}
          {isAdmin(user) && (
            <li>
              <Link href="/admin" className="text-[#8b5cf6] transition-colors hover:text-[#fafafa]">
                Admin
              </Link>
            </li>
          )}
          {user ? (
            <li className="flex items-center gap-3">
              <span className="text-[#a1a1aa]" title={user.email ?? undefined}>
                {user.display_name || user.username || user.email}
              </span>
              <SignOutButton />
            </li>
          ) : (
            <li>
              <Link
                href="/login"
                className="rounded-md border border-[#27272a] px-3 py-1.5 text-[#fafafa] transition-colors hover:bg-[#18181b]"
              >
                Sign in
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

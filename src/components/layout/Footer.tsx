import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/community', label: 'Community' },
  { href: '/suggestions', label: 'Suggestions' },
  { href: '/privacy', label: 'Privacy' },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#27272a]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 lg:flex-row">
        <p className="text-sm text-[#71717a]">
          Xamcode Build in Public — sample content and demo mode until Supabase is configured.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-[#a1a1aa]">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[#fafafa]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-[#52525b]">Build in Public project demo.</p>
      </div>
    </footer>
  );
}

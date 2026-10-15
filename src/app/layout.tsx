import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Xamcode - Building in Public',
    template: '%s | Xamcode',
  },
  description: 'Follow the real journey of building Xamcode — from early development and testing to verified milestones and launch. Transparent development, open roadmap, community-driven.',
  keywords: ['Xamcode', 'build in public', 'development dashboard', 'open development', 'milestones', 'roadmap', 'changelog'],
  authors: [{ name: 'Xamcode Team' }],
  openGraph: {
    type: 'website',
    title: 'Xamcode - Building in Public',
    description: 'Follow the real journey of building Xamcode — transparent development, open roadmap, community-driven.',
    siteName: 'Xamcode',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xamcode - Building in Public',
    description: 'Follow the real journey of building Xamcode — transparent development, open roadmap, community-driven.',
  },
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

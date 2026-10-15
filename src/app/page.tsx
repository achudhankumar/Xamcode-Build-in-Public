import Link from 'next/link';
import { ReadinessBadge } from '@/components/bip/ReadinessBadge';

export default function HomePage() {
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      <section style={{
        position: 'relative',
        padding: '6rem 0 4rem',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 1.5rem'
        }}>
          <div style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.375rem 0.75rem',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#3b82f6',
              textTransform: 'uppercase'
            }}>
              Building in Public
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.5rem'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              XAMCODE
            </span>
            <br />
            <span style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', fontWeight: 500, color: '#a1a1aa' }}>
              BUILDING IN PUBLIC
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#a1a1aa', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Follow the real journey of building Xamcode.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href='/progress' style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500 }}>
              Explore Progress
            </Link>
            <Link href='/roadmap' style={{ display: 'inline-flex', alignItems: 'center', padding: '0.75rem 1.5rem', background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500 }}>
              View Roadmap
            </Link>
            <Link href='/early-access' style={{ display: 'inline-flex', alignItems: 'center', padding: '0.75rem 1.5rem', background: 'transparent', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500 }}>
              Join Early Access
            </Link>
          </div>
          <ReadinessBadge />
        </div>
      </section>
    </div>
  );
}

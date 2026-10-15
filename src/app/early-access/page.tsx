import EarlyAccessForm from './EarlyAccessForm';

export const metadata = {
  title: 'Early Access',
  description: 'Join the Xamcode waitlist.',
};

export default function EarlyAccessPage() {
  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fafafa', margin: '0 0 1rem' }}>
        Join Early Access
      </h1>
      <p style={{ fontSize: '1.125rem', color: '#a1a1aa', margin: '0 0 2rem', lineHeight: 1.6 }}>
        Be the first to know when Xamcode launches. Join our waiting list.
      </p>
      <EarlyAccessForm />
    </div>
  );
}

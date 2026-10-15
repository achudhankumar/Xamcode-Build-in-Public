export default function PrivacyPage() {
  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fafafa', margin: '0 0 0.75rem' }}>
          Privacy Policy
        </h1>
      </header>
      <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
        <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: 0 }}>
          This is a demonstration project. No personal data is collected or stored.
          When deployed with real features, a complete privacy policy will be provided.
        </p>
      </div>
    </div>
  );
}

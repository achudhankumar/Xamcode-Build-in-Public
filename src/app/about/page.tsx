export default function AboutPage() {
  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fafafa', margin: '0 0 0.75rem' }}>
          About Xamcode
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>
          Learn more about the Xamcode project and its mission.
        </p>
      </header>
      <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
        <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: 0 }}>
          Xamcode is a development project focused on building innovative tools.
          This site documents the journey from concept to launch.
        </p>
      </div>
    </div>
  );
}

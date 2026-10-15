import LoginForm from './LoginForm';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to Xamcode to participate in discussions and voting.',
};

export default function LoginPage() {
  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '440px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 800,
          color: '#fafafa',
          margin: '0 0 0.5rem',
          textAlign: 'center',
        }}
      >
        Sign in
      </h1>
      <p style={{ color: '#a1a1aa', textAlign: 'center', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
        Sign in to join discussions and vote on suggestions.
      </p>
      <LoginForm />
    </div>
  );
}

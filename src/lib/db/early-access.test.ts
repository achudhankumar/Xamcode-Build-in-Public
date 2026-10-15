import { describe, it, expect } from 'vitest';
import { validateEarlyAccessSignup } from './early-access';

function validInput() {
  return {
    email: 'user@example.com',
    display_name: 'Test User',
    interest: 'features' as const,
    opted_in: true,
  };
}

describe('validateEarlyAccessSignup', () => {
  it('accepts a valid submission', () => {
    expect(validateEarlyAccessSignup(validInput())).toBeNull();
  });

  it('rejects missing consent', () => {
    const err = validateEarlyAccessSignup({ ...validInput(), opted_in: false });
    expect(err).toMatchObject({ type: 'VALIDATION', field: 'opted_in' });
  });

  it('rejects missing email', () => {
    const err = validateEarlyAccessSignup({ ...validInput(), email: '' });
    expect(err).toMatchObject({ type: 'VALIDATION', field: 'email' });
  });

  it('rejects malformed email', () => {
    const err = validateEarlyAccessSignup({ ...validInput(), email: 'not-an-email' });
    expect(err).toMatchObject({ field: 'email' });
  });

  it('rejects over-long display name', () => {
    const err = validateEarlyAccessSignup({ ...validInput(), display_name: 'a'.repeat(121) });
    expect(err).toMatchObject({ field: 'display_name' });
  });

  it('rejects an invalid interest value', () => {
    const err = validateEarlyAccessSignup({
      ...validInput(),
      interest: 'nonsense' as unknown as 'general',
    });
    expect(err).toMatchObject({ field: 'interest' });
  });

  it('allows optional fields to be omitted', () => {
    const err = validateEarlyAccessSignup({ email: 'user@example.com', opted_in: true });
    expect(err).toBeNull();
  });
});

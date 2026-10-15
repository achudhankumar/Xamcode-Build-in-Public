import { describe, it, expect } from 'vitest';
import { isValidEmail } from './validate-email';

describe('isValidEmail', () => {
  it('accepts a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('accepts subdomain', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects whitespace only', () => {
    expect(isValidEmail('   ')).toBe(false);
  });

  it('rejects no at sign', () => {
    expect(isValidEmail('notanemail')).toBe(false);
  });

  it('rejects no domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects no TLD', () => {
    expect(isValidEmail('user@example')).toBe(false);
  });

  it('rejects spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('rejects too long email', () => {
    const tooLong = 'a'.repeat(250) + '@example.com';
    expect(isValidEmail(tooLong)).toBe(false);
  });

  it('rejects non-string', () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
  });
});

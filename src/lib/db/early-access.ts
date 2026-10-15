import type { EarlyAccessSignupInput } from '@/types/supabase';

export type EarlyAccessSignupError =
  | { type: 'VALIDATION'; field: string; message: string }
  | { type: 'CONFIGURATION' }
  | { type: 'DATABASE_ERROR'; message: string }
  | { type: 'DUPLICATE_EMAIL' }
  | { type: 'UNKNOWN_ERROR'; message: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;

const INTEREST_OPTIONS: EarlyAccessSignupInput['interest'][] = [
  'general',
  'features',
  'testing',
  'documentation',
  'other',
];

export function validateEarlyAccessSignup(
  input: EarlyAccessSignupInput,
): EarlyAccessSignupError | null {
  if (!input.opted_in) {
    return {
      type: 'VALIDATION',
      field: 'opted_in',
      message: 'You must agree to receive updates to join the waitlist.',
    };
  }

  if (!input.email || typeof input.email !== 'string') {
    return { type: 'VALIDATION', field: 'email', message: 'Email address is required.' };
  }

  const trimmedEmail = input.email.trim();
  if (trimmedEmail.length === 0) {
    return { type: 'VALIDATION', field: 'email', message: 'Email address is required.' };
  }
  if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
    return { type: 'VALIDATION', field: 'email', message: 'Email address is too long.' };
  }
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { type: 'VALIDATION', field: 'email', message: 'Please enter a valid email address.' };
  }

  if (input.display_name !== undefined) {
    if (typeof input.display_name !== 'string') {
      return { type: 'VALIDATION', field: 'display_name', message: 'Display name must be text.' };
    }
    const trimmedName = input.display_name.trim();
    if (trimmedName.length > MAX_NAME_LENGTH) {
      return { type: 'VALIDATION', field: 'display_name', message: 'Display name is too long.' };
    }
  }

  if (input.interest !== undefined && input.interest !== null) {
    if (!INTEREST_OPTIONS.includes(input.interest)) {
      return { type: 'VALIDATION', field: 'interest', message: 'Please select a valid interest.' };
    }
  }

  return null;
}

export async function submitEarlyAccessSignup(
  input: EarlyAccessSignupInput,
): Promise<
  | { success: true; signup: { id: string; email: string } }
  | { success: false; error: EarlyAccessSignupError }
> {
  const validationError = validateEarlyAccessSignup(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    // Prefer the privileged service-role client; fall back to the public client
    // (RLS allows public INSERT on early_access_signups) so registration still
    // works when only the publishable key is configured. Server-side only.
    const { getServiceRoleClientOrUndefined, getSupabaseServerClientOrUndefined } = await import(
      '@/lib/db/supabase'
    );
    const supabase = getServiceRoleClientOrUndefined() ?? getSupabaseServerClientOrUndefined();
    if (!supabase) {
      return { success: false, error: { type: 'CONFIGURATION' } };
    }
    const trimmedEmail = input.email.trim().toLowerCase();
    const trimmedName = input.display_name?.trim() || null;
    const interest = input.interest ?? null;

    const { data, error } = await supabase
      .from('early_access_signups')
      .insert({
        email: trimmedEmail,
        display_name: trimmedName,
        interest,
        opted_in_at: new Date().toISOString(),
      })
      .select('id, email')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: { type: 'DUPLICATE_EMAIL' } };
      }

      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: 'Unable to save your registration. Please try again later.',
        },
      };
    }

    return {
      success: true,
      signup: { id: data.id, email: data.email },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred. Please try again later.';
    return { success: false, error: { type: 'UNKNOWN_ERROR', message } };
  }
}

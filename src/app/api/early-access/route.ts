import { NextResponse } from 'next/server';
import { validateEarlyAccessSignup, submitEarlyAccessSignup } from '@/lib/db/early-access';
import { rateLimit, clientKey } from '@/lib/rate-limit';
import type { EarlyAccessSignupInput } from '@/types/supabase';

export interface EarlyAccessErrors {
  errors: { type: string; field?: string; message: string }[];
}

const INTEREST_VALUES = [
  'general',
  'features',
  'testing',
  'documentation',
  'other',
] as const;

type InterestValue = (typeof INTEREST_VALUES)[number];

function jsonErrors(errors: EarlyAccessErrors['errors'], status: number) {
  return NextResponse.json<EarlyAccessErrors>({ errors }, {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function toFieldErrors(error: { type: string; field?: string; message: string } | null): EarlyAccessErrors | null {
  if (!error) {
    return null;
  }
  return { errors: [{ type: error.type, field: error.field ?? undefined, message: error.message }] };
}

export async function POST(request: Request) {
  // Basic abuse mitigation: 5 signups per minute per IP.
  const limited = rateLimit(clientKey(request, 'early-access'), 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, {
      status: 429,
      headers: { 'Retry-After': String(limited.retryAfterSeconds), 'Cache-Control': 'no-store' },
    });
  }

  let body: { display_name?: string; email?: string; interest?: string | null; opted_in?: boolean };

  try {
    body = await request.json();
  } catch {
    return jsonErrors([{ type: 'VALIDATION', field: 'body', message: 'Invalid request body.' }], 400);
  }

  // Validate the interest value. Absent/null/empty is allowed (optional field),
  // but a present-but-unknown value is rejected rather than silently coerced.
  let interest: InterestValue | null = null;
  const rawInterest = body.interest;
  if (rawInterest !== undefined && rawInterest !== null && rawInterest !== '') {
    if (typeof rawInterest === 'string' && (INTEREST_VALUES as readonly string[]).includes(rawInterest)) {
      interest = rawInterest as InterestValue;
    } else {
      return jsonErrors([{ type: 'VALIDATION', field: 'interest', message: 'Please select a valid interest.' }], 400);
    }
  }

  const input: EarlyAccessSignupInput = {
    display_name: body.display_name ?? '',
    email: body.email ?? '',
    interest,
    opted_in: !!body.opted_in,
  };

  const validationError = validateEarlyAccessSignup(input);
  const fieldErrors = toFieldErrors(
    validationError ? { ...validationError, message: 'message' in validationError ? validationError.message : 'Invalid value.' } : null,
  );
  if (fieldErrors) {
    return NextResponse.json<EarlyAccessErrors>(fieldErrors, {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const result = await submitEarlyAccessSignup(input);

  if (result.success) {
    return NextResponse.json({ ok: true, signup: result.signup }, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  if (result.error.type === 'DUPLICATE_EMAIL') {
    return jsonErrors([{ type: 'DUPLICATE_EMAIL', field: 'email', message: 'This email is already on the waitlist.' }], 409);
  }

  if (result.error.type === 'CONFIGURATION') {
    return NextResponse.json({ error: 'Early-access signup is not configured yet.' }, {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const message = 'message' in result.error ? result.error.message : 'Unable to save your registration. Please try again later.';
  return NextResponse.json({ error: message ?? 'Unable to save your registration. Please try again later.' }, {
    status: 500,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

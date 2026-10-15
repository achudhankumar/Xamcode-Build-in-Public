// Server-side validation for admin content management inputs.
import type { FieldError } from '@/lib/validation/community';

export const ROADMAP_STATUSES = ['planned', 'in_progress', 'completed', 'released', 'on_hold'] as const;
export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export const MILESTONE_TYPES = ['feature', 'improvement', 'fix', 'verification', 'release'] as const;
export const MILESTONE_STATUSES = ['planned', 'in_progress', 'completed', 'verified'] as const;
export const SIGNUP_STATUSES = ['pending', 'confirmed', 'unsubscribed', 'bounced'] as const;
export const APP_ROLES = ['member', 'moderator', 'admin'] as const;

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateRoadmapItem(input: Record<string, unknown>): FieldError[] {
  const errors: FieldError[] = [];

  const title = str(input.title);
  if (title.length < 3 || title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be between 3 and 200 characters.' });
  }

  const description = str(input.description);
  if (description.length < 1 || description.length > 5000) {
    errors.push({ field: 'description', message: 'Description must be between 1 and 5000 characters.' });
  }

  if (!ROADMAP_STATUSES.includes(input.status as (typeof ROADMAP_STATUSES)[number])) {
    errors.push({ field: 'status', message: 'Please choose a valid status.' });
  }

  if (!PRIORITIES.includes(input.priority as (typeof PRIORITIES)[number])) {
    errors.push({ field: 'priority', message: 'Please choose a valid priority.' });
  }

  const category = str(input.category);
  if (category.length < 1 || category.length > 80) {
    errors.push({ field: 'category', message: 'Category must be between 1 and 80 characters.' });
  }

  return errors;
}

export function validateMilestone(input: Record<string, unknown>): FieldError[] {
  const errors: FieldError[] = [];

  const title = str(input.title);
  if (title.length < 3 || title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be between 3 and 200 characters.' });
  }

  if (!MILESTONE_TYPES.includes(input.milestone_type as (typeof MILESTONE_TYPES)[number])) {
    errors.push({ field: 'milestone_type', message: 'Please choose a valid milestone type.' });
  }

  if (!MILESTONE_STATUSES.includes(input.status as (typeof MILESTONE_STATUSES)[number])) {
    errors.push({ field: 'status', message: 'Please choose a valid status.' });
  }

  const weight = input.weight;
  if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0 || weight > 100) {
    errors.push({ field: 'weight', message: 'Weight must be a number between 0 and 100.' });
  }

  return errors;
}

export function validateChangelogEntry(input: Record<string, unknown>): FieldError[] {
  const errors: FieldError[] = [];

  const version = str(input.version);
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
    errors.push({ field: 'version', message: 'Version must look like 1.2.3 (semantic versioning).' });
  }

  const summary = str(input.summary);
  if (summary.length < 3 || summary.length > 300) {
    errors.push({ field: 'summary', message: 'Summary must be between 3 and 300 characters.' });
  }

  const body = input.body;
  if (body !== undefined && body !== null && str(body).length > 20000) {
    errors.push({ field: 'body', message: 'Body must be 20000 characters or fewer.' });
  }

  for (const listField of ['features', 'improvements', 'fixes', 'limitations'] as const) {
    const value = input[listField];
    if (value === undefined || value === null) continue;
    if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || v.length > 300)) {
      errors.push({ field: listField, message: `${listField} must be a list of short strings.` });
    }
  }

  return errors;
}

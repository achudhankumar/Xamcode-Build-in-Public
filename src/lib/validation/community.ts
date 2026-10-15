// Shared server-side validation for community + suggestion inputs.

export const DISCUSSION_CATEGORIES = [
  'general',
  'feedback',
  'help',
  'showcase',
  'announcements',
] as const;
export type DiscussionCategory = (typeof DISCUSSION_CATEGORIES)[number];

export const SUGGESTION_STATUSES = [
  'open',
  'under_review',
  'planned',
  'in_progress',
  'completed',
  'declined',
] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export interface FieldError {
  field: string;
  message: string;
}

export function validateDiscussion(input: {
  title?: unknown;
  body?: unknown;
  category?: unknown;
}): FieldError[] {
  const errors: FieldError[] = [];

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length < 3 || title.length > 150) {
    errors.push({ field: 'title', message: 'Title must be between 3 and 150 characters.' });
  }

  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (body.length < 1 || body.length > 10000) {
    errors.push({ field: 'body', message: 'Body must be between 1 and 10000 characters.' });
  }

  const category = input.category;
  if (
    category !== undefined &&
    category !== null &&
    category !== '' &&
    !DISCUSSION_CATEGORIES.includes(category as DiscussionCategory)
  ) {
    errors.push({ field: 'category', message: 'Please choose a valid category.' });
  }

  return errors;
}

export function validateReply(input: { body?: unknown }): FieldError[] {
  const errors: FieldError[] = [];
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (body.length < 1 || body.length > 5000) {
    errors.push({ field: 'body', message: 'Reply must be between 1 and 5000 characters.' });
  }
  return errors;
}

export function validateSuggestion(input: {
  title?: unknown;
  body?: unknown;
}): FieldError[] {
  const errors: FieldError[] = [];

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length < 3 || title.length > 150) {
    errors.push({ field: 'title', message: 'Title must be between 3 and 150 characters.' });
  }

  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (body.length < 1 || body.length > 5000) {
    errors.push({ field: 'body', message: 'Details must be between 1 and 5000 characters.' });
  }

  return errors;
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

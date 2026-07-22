import { ApiRequestError } from './client';

/**
 * Turns a caught error into a list of human-readable messages.
 *
 * For validation errors, the backend returns `details` shaped like
 * `{ fieldName: ["message 1", "message 2"], ... }` (see
 * server/src/middleware/validate.ts). This flattens that into a flat list of
 * every individual message so the UI can show exactly what's wrong per field
 * — e.g. "Password must contain an uppercase letter" — instead of the
 * generic top-level "Validation failed".
 */
export function getErrorMessages(err: unknown): string[] {
  if (err instanceof ApiRequestError) {
    if (err.code === 'VALIDATION_ERROR' && err.details && typeof err.details === 'object') {
      const details = err.details as Record<string, string[] | undefined>;
      const messages = Object.values(details)
        .flat()
        .filter((message): message is string => typeof message === 'string' && message.length > 0);
      if (messages.length > 0) return messages;
    }
    return [err.message];
  }

  if (err instanceof Error) return [err.message];

  return ['Something went wrong. Please try again.'];
}

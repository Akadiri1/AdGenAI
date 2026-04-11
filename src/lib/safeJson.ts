/**
 * Parse a JSON string defensively. Returns the fallback if input is null,
 * undefined, empty, or invalid JSON.
 */
export function safeJsonParse<T = unknown>(
  input: string | null | undefined,
  fallback: T,
): T {
  if (!input) return fallback;
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

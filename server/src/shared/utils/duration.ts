const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses a short duration string (e.g. "15m", "7d") into milliseconds.
 * Throws if the format is not recognized — fail fast on a bad env value
 * rather than silently computing a wrong expiry.
 */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}". Expected e.g. "15m", "7d".`);
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit];
}

export function addDuration(from: Date, duration: string): Date {
  return new Date(from.getTime() + parseDurationToMs(duration));
}

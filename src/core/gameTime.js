export const DAYS_PER_YEAR = 365;
export const createGameTime = (initial = { year: 2187, day: 142 }) => ({ ...initial });

export function advanceDays(time, days) {
  if (!Number.isSafeInteger(days) || days < 0) {
    throw new RangeError('Game time can only advance by a non-negative whole number of days.');
  }
  if (!Number.isSafeInteger(time.year) || time.year < 1 || !Number.isSafeInteger(time.day) || time.day < 1 || time.day > DAYS_PER_YEAR) {
    throw new RangeError('Game time must have a valid year and day.');
  }
  if (days === 0) return time;
  const total = time.day + days;
  if (!Number.isSafeInteger(total)) throw new RangeError('Game time is outside the supported range.');
  const nextYear = time.year + Math.floor((total - 1) / DAYS_PER_YEAR);
  if (!Number.isSafeInteger(nextYear)) throw new RangeError('Game time is outside the supported range.');
  time.year = nextYear;
  time.day = ((total - 1) % DAYS_PER_YEAR) + 1;
  return time;
}

export function formatTime(time) { return `ДЕНЬ ${String(time.day).padStart(3, '0')} · ${time.year}`; }

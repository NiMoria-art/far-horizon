export const createGameTime = (initial = { year: 2187, day: 142 }) => ({ ...initial });
export function advanceDays(time, days) {
  const total = time.day + days;
  time.year += Math.floor((total - 1) / 365);
  time.day = ((total - 1) % 365) + 1;
  return time;
}
export function formatTime(time) { return `ДЕНЬ ${String(time.day).padStart(3, '0')} · ${time.year}`; }

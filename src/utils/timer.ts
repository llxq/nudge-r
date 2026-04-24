const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

export function getMovementRemainingMs(
  startTime: number | null,
  intervalMin: number,
  now = Date.now()
) {
  if (!startTime || intervalMin <= 0) {
    return 0;
  }

  const intervalMs = intervalMin * MINUTE_MS;

  if (now <= startTime) {
    return intervalMs;
  }

  const elapsed = now - startTime;
  const remainder = elapsed % intervalMs;

  return remainder === 0 ? intervalMs : intervalMs - remainder;
}

export function formatRemainingTime(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / SECOND_MS));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Human-readable run duration, e.g. 42s, 1m 23s, 3m. Safe on null/undefined.
export function formatDuration(ms?: number): string {
  if (ms == null || !isFinite(ms) || ms < 0) return "";
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

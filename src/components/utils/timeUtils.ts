export const parseTimeToMs = (timeStr: string | undefined | null): number | null => {
  if (!timeStr) return null;
  const timeOnly = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
  const parts = timeOnly.split(':');
  const hh = Number(parts[0] || 0);
  const mm = Number(parts[1] || 0);
  const ss = Number(parts[2] || 0);
  const d = new Date(1970, 0, 1, hh, mm, ss);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
};

export const formatTimeFromMs = (ms: number): string => {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

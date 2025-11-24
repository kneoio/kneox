const STORAGE_KEY = 'kneox.globalPageSize';

export function getGlobalPageSize(defaultSize: number = 10): number {
  if (typeof window === 'undefined') return defaultSize;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultSize;
}

export function setGlobalPageSize(size: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, String(size));
}

/** Links typed into the content editor must stay on this site, jump within a page, or use http(s) / mailto. */
export function safeHref(value: string | null | undefined, fallback = '#'): string {
  const v = (value ?? '').trim();
  if (!v) return fallback;
  if (v.startsWith('//') || v.includes('\\')) return fallback;
  if (v.startsWith('/') || v.startsWith('#')) return v;
  return /^(https?:\/\/|mailto:)/i.test(v) ? v : fallback;
}

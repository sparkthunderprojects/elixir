/** Only allow a "next" address that stays on this site and is a known area. */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  return value === '/admin' || value.startsWith('/admin/') ? value : null;
}

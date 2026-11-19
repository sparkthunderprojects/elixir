/** Only allow a "next" address that stays on this site and is a known area. */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  const ok = value === '/admin' || value.startsWith('/admin/') || value === '/account' || value.startsWith('/account/') || value === '/partner' || value.startsWith('/partner/');
  return ok ? value : null;
}

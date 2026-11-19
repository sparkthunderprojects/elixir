import { NextResponse, type NextRequest } from 'next/server';
import { redirectWithCookies, updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, user, configured } = await updateSession(request);
  if (!configured) return response;
  const path = request.nextUrl.pathname;
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  const isAccount = path === '/account' || path.startsWith('/account/') || path === '/partner' || path.startsWith('/partner/');
  if ((isAdmin || isAccount) && !user) return redirectWithCookies(request, response, `/login?next=${encodeURIComponent(path)}`);
  if (!isAdmin && !isAccount && user && (path === '/login' || path === '/signup')) {
    return redirectWithCookies(request, response, '/');
  }
  return response ?? NextResponse.next();
}

// Public pages are not matched, so they stay fast and static.
export const config = { matcher: ['/admin', '/admin/:path*', '/account', '/account/:path*', '/partner', '/partner/:path*', '/login', '/signup'] };

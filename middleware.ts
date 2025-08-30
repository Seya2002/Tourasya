import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Disable caching for private pages to prevent back-button showing protected content
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Apply to all admin and dashboard routes, and home if treated as private
  const pathname = req.nextUrl.pathname;
  const isPrivate = pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/home');

  if (isPrivate) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    res.headers.set('Surrogate-Control', 'no-store');
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/home/:path*'],
};




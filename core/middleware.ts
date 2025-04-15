import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Prevent service worker from handling API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next({
      headers: {
        'Service-Worker-Allowed': process.env.NODE_ENV === 'production' ? 'true' : 'false',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
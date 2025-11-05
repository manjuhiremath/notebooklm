import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only for PDF routes
  if (request.nextUrl.pathname.startsWith('/uploads/')) {
    const response = NextResponse.next();
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Cache-Control', 'public, max-age=3600');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/uploads/:path*'],
};

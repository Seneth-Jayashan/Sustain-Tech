import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isPublicRoute = pathname === '/login' || pathname.startsWith('/api/auth');

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isPublicRoute && pathname !== '/api/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      // Decode JWT to check role
      const secretKey = process.env.SESSION_SECRET || 'fallback-secret-key-do-not-use-in-prod';
      const key = new TextEncoder().encode(secretKey);
      const { payload } = await jwtVerify(session, key, { algorithms: ['HS256'] });
      
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

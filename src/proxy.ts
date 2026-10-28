import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isPublicRoute = 
    pathname === '/' ||
    pathname === '/practice' ||
    pathname.startsWith('/practice') ||
    pathname === '/locked' ||
    pathname.startsWith('/locked') ||
    pathname === '/login' || 
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/game/access-status') ||
    pathname.startsWith('/scenario') ||
    pathname.startsWith('/assets') ||
    /\.(mp3|wav|ogg|jpg|jpeg|png|svg|ico|webp)$/i.test(pathname);

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let role = 'player';
  if (session) {
    try {
      const secretKey = process.env.SESSION_SECRET || 'fallback-secret-key-do-not-use-in-prod';
      const key = new TextEncoder().encode(secretKey);
      const { payload } = await jwtVerify(session, key, { algorithms: ['HS256'] });
      role = payload.role as string;
    } catch (e) {
      if (!isPublicRoute) {
        if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  // Route directing based on authentication and role (for login page when already authenticated)
  if (session && pathname === '/login') {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Admin routing protection
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (role !== 'admin') {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Prevent admin from accessing the player dashboard
  if (pathname.startsWith('/dashboard') && role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

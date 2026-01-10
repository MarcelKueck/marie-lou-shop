import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Session token settings
const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate a secure session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Verify admin credentials
export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@marielou.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  return email === adminEmail && password === adminPassword;
}

// Set admin session cookie
export async function setAdminSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });
}

// Clear admin session cookie
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Check if user is authenticated (for server components)
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value !== undefined && session.value.length > 0;
}

// Check if request is authenticated (for middleware)
export function isAdminAuthenticatedFromRequest(request: NextRequest): boolean {
  const session = request.cookies.get(SESSION_COOKIE_NAME);
  return session?.value !== undefined && session.value.length > 0;
}

// Middleware helper to protect admin routes
export function createAdminAuthMiddleware() {
  return (request: NextRequest) => {
    const isAuthenticated = isAdminAuthenticatedFromRequest(request);
    const isLoginPage = request.nextUrl.pathname === '/admin/login';
    
    // If not authenticated and not on login page, redirect to login
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // If authenticated and on login page, redirect to admin dashboard
    if (isAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL('/admin/refunds', request.url));
    }
    
    return null; // Continue to the page
  };
}

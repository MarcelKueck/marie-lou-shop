import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Admin authentication check
function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session');
  return session?.value !== undefined && session.value.length > 0;
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Handle admin routes - protect with authentication
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const isAuthenticated = isAdminAuthenticated(request);
    
    // If not authenticated and not on login page, redirect to login
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // If authenticated and on login page, redirect to admin dashboard
    if (isAuthenticated && isLoginPage) {
      const redirect = request.nextUrl.searchParams.get('redirect') || '/admin';
      return NextResponse.redirect(new URL(redirect, request.url));
    }
    
    // Allow the request to continue
    return NextResponse.next();
  }
  
  // Handle non-admin routes with i18n middleware
  // Detect brand from hostname
  const hostname = request.headers.get('host') || '';
  const brand = hostname.includes('tea') || hostname.includes('tee') ? 'tea' : 'coffee';
  
  // Run the intl middleware first
  const response = intlMiddleware(request);
  
  // Add brand header for server components
  response.headers.set('x-brand', brand);
  
  return response;
}

export const config = {
  // Match internationalized pathnames and admin routes
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(de|en)/:path*',
    
    // Admin routes (protected by auth)
    '/admin/:path*',
    
    // Enable redirects that add missing locales
    // (e.g. `/shop` -> `/de/shop`)
    // Exclude api, admin, and static files from locale processing
    '/((?!api|admin|_next|_vercel|.*\\..*).*)',
  ],
};

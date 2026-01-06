import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
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
  // Match only internationalized pathnames
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(de|en)/:path*',
    
    // Enable redirects that add missing locales
    // (e.g. `/shop` -> `/de/shop`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

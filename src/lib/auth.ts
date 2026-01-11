import { db } from '@/db';
import { customers, sessions } from '@/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'marie_lou_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Hash a password with salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a session for a customer (stores in database)
 */
export async function createSession(customerId: string): Promise<string> {
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  
  // Store session in database
  await db.insert(sessions).values({
    id: token,
    customerId,
    expiresAt,
    createdAt: now,
  });
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  
  return token;
}

/**
 * Get the current session. If token is provided, read directly, otherwise read from cookies.
 */
export async function getSession(token?: string): Promise<{ customerId: string } | null> {
  let tkn = token;

  if (!tkn) {
    const cookieStore = await cookies();
    tkn = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  }

  if (!tkn) return null;

  // Look up session in database
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, tkn),
      gt(sessions.expiresAt, new Date())
    ),
  });

  if (!session) return null;

  return { customerId: session.customerId };
}

/**
 * Get the current logged-in customer. Accepts optional token to lookup by token.
 */
export async function getCurrentCustomer(token?: string) {
  const session = await getSession(token);
  if (!session) return null;
  
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, session.customerId),
  });
  
  return customer || null;
}

/**
 * Destroy a session. If token is provided, remove that session; otherwise remove cookie session.
 */
export async function destroySession(token?: string): Promise<void> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Delete from database
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  if (cookieToken) {
    await db.delete(sessions).where(eq(sessions.id, cookieToken));
  }
  
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Find customer by email
 */
export async function findCustomerByEmail(email: string) {
  return db.query.customers.findFirst({
    where: eq(customers.email, email.toLowerCase()),
  });
}

/**
 * Clean up expired sessions (call periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(
    lt(sessions.expiresAt, new Date())
  );
}

/**
 * Logout current user (alias for destroySession)
 */
export async function logout(): Promise<void> {
  await destroySession();
}

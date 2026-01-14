/**
 * B2B Authentication Library
 * 
 * Separate authentication system for B2B portal, independent of D2C customer auth.
 * Uses similar patterns to src/lib/auth.ts but with B2B-specific tables.
 */

import { db } from '@/db';
import { b2bCompanies, b2bSessions, B2BCompany, passwordResetTokens } from '@/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const B2B_SESSION_COOKIE_NAME = 'marie_lou_b2b_session';
const B2B_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

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
  if (!salt || !hash) return false;
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
 * Generate a temporary password for new B2B accounts
 */
export function generateTemporaryPassword(): string {
  // Generate a readable password: 3 words + 2 digits
  const words = ['coffee', 'fresh', 'smart', 'brew', 'bean', 'roast', 'blend', 'aroma'];
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const digits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${word1}${word2}${digits}`;
}

/**
 * Generate a unique promo code for a company
 * Format: MLOU-XXXXX (where XXXXX is derived from company name)
 */
export function generatePromoCode(companyName: string): string {
  // Take first 5 chars of company name, uppercase, alphanumeric only
  const base = companyName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5)
    .padEnd(5, 'X');
  
  // Add random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
  
  return `MLOU-${base}${suffix}`;
}

/**
 * Create a session for a B2B company
 */
export async function createB2BSession(companyId: string): Promise<string> {
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(Date.now() + B2B_SESSION_MAX_AGE * 1000);
  
  // Store session in database
  await db.insert(b2bSessions).values({
    id: token,
    companyId,
    expiresAt,
    createdAt: now,
  });
  
  const cookieStore = await cookies();
  cookieStore.set(B2B_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: B2B_SESSION_MAX_AGE,
    path: '/',
  });
  
  return token;
}

/**
 * Get the current B2B session
 */
export async function getB2BSession(token?: string): Promise<{ companyId: string } | null> {
  let tkn = token;

  if (!tkn) {
    const cookieStore = await cookies();
    tkn = cookieStore.get(B2B_SESSION_COOKIE_NAME)?.value;
  }

  if (!tkn) return null;

  // Look up session in database
  const sessions = await db
    .select()
    .from(b2bSessions)
    .where(and(
      eq(b2bSessions.id, tkn),
      gt(b2bSessions.expiresAt, new Date())
    ))
    .limit(1);

  if (!sessions.length) return null;

  return { companyId: sessions[0].companyId };
}

/**
 * Get the current logged-in B2B company
 */
export async function getCurrentB2BCompany(token?: string): Promise<B2BCompany | null> {
  const session = await getB2BSession(token);
  if (!session) return null;
  
  const companies = await db
    .select()
    .from(b2bCompanies)
    .where(eq(b2bCompanies.id, session.companyId))
    .limit(1);
  
  return companies[0] || null;
}

/**
 * Destroy a B2B session (logout)
 */
export async function destroyB2BSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(B2B_SESSION_COOKIE_NAME)?.value;
  
  if (token) {
    // Delete from database
    await db.delete(b2bSessions).where(eq(b2bSessions.id, token));
  }
  
  // Clear cookie
  cookieStore.delete(B2B_SESSION_COOKIE_NAME);
}

/**
 * Authenticate a B2B company by email and password
 */
export async function authenticateB2BCompany(
  email: string,
  password: string
): Promise<{ success: boolean; company?: B2BCompany; error?: string }> {
  // Find company by contact email
  const companies = await db
    .select()
    .from(b2bCompanies)
    .where(eq(b2bCompanies.contactEmail, email.toLowerCase()))
    .limit(1);
  
  const company = companies[0];
  
  if (!company) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  // Check if company has a password set
  if (!company.passwordHash) {
    return { success: false, error: 'Account not yet activated. Please check your email for setup instructions.' };
  }
  
  // Check if company is active or pending
  if (company.status === 'cancelled') {
    return { success: false, error: 'This account has been cancelled. Please contact support.' };
  }
  
  if (company.status === 'inquiry') {
    return { success: false, error: 'Your inquiry is still being processed. We will contact you soon.' };
  }
  
  // Verify password
  if (!verifyPassword(password, company.passwordHash)) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  return { success: true, company };
}

/**
 * Set password for a B2B company (initial setup or password change)
 */
export async function setB2BPassword(companyId: string, password: string): Promise<boolean> {
  const passwordHash = hashPassword(password);
  
  await db
    .update(b2bCompanies)
    .set({ 
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(b2bCompanies.id, companyId));
  
  return true;
}

/**
 * Create a password reset token for B2B company
 * Reuses the passwordResetTokens table with company ID as "customer" ID
 */
export async function createB2BPasswordResetToken(companyId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  await db.insert(passwordResetTokens).values({
    id: crypto.randomUUID(),
    customerId: companyId, // Using customerId field for B2B company ID
    token,
    expiresAt,
    createdAt: new Date(),
  });
  
  return token;
}

/**
 * Verify and consume a B2B password reset token
 */
export async function verifyB2BPasswordResetToken(
  token: string
): Promise<{ valid: boolean; companyId?: string; error?: string }> {
  const tokens = await db
    .select()
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.token, token),
      gt(passwordResetTokens.expiresAt, new Date())
    ))
    .limit(1);
  
  const resetToken = tokens[0];
  
  if (!resetToken) {
    return { valid: false, error: 'Invalid or expired reset token' };
  }
  
  if (resetToken.usedAt) {
    return { valid: false, error: 'This reset link has already been used' };
  }
  
  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));
  
  return { valid: true, companyId: resetToken.customerId };
}

/**
 * Clean up expired B2B sessions (called by cron job)
 */
export async function cleanupExpiredB2BSessions(): Promise<number> {
  // Delete sessions where expires_at is in the past
  await db
    .delete(b2bSessions)
    .where(lt(b2bSessions.expiresAt, new Date()));
  
  // Return 0 since SQLite doesn't provide rowsAffected easily
  return 0;
}

/**
 * Validate a B2B promo code (for employee cross-sell)
 */
export async function validateB2BPromoCode(
  code: string
): Promise<{ valid: boolean; company?: B2BCompany; discountPercent?: number; error?: string }> {
  if (!code || !code.startsWith('MLOU-')) {
    return { valid: false, error: 'Invalid promo code format' };
  }
  
  const companies = await db
    .select()
    .from(b2bCompanies)
    .where(eq(b2bCompanies.promoCode, code.toUpperCase()))
    .limit(1);
  
  const company = companies[0];
  
  if (!company) {
    return { valid: false, error: 'Promo code not found' };
  }
  
  if (company.status !== 'active') {
    return { valid: false, error: 'This promo code is no longer active' };
  }
  
  return {
    valid: true,
    company,
    discountPercent: company.promoDiscountPercent || 10,
  };
}

/**
 * Check if a request is authenticated for B2B portal
 * Returns the company if authenticated, null otherwise
 */
export async function requireB2BAuth(): Promise<B2BCompany | null> {
  const company = await getCurrentB2BCompany();
  
  if (!company) {
    return null;
  }
  
  // Only allow active or paused companies to access portal
  if (!['active', 'paused', 'pending'].includes(company.status)) {
    return null;
  }
  
  return company;
}

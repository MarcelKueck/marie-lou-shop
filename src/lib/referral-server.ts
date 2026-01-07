import 'server-only';
import { db } from '@/db';
import { referralCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a unique, memorable referral code with DB uniqueness check
 * Format: MARIE-XXXXX (5 alphanumeric characters, no ambiguous ones)
 */
export async function generateReferralCode(): Promise<string> {
  // Avoid ambiguous characters: 0/O, 1/I/L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  
  // Try up to 10 times to generate a unique code
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const fullCode = `MARIE-${code}`;
    
    // Check if code already exists
    const existing = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.code, fullCode),
    });
    
    if (!existing) {
      return fullCode;
    }
  }
  
  // If we couldn't generate unique code after 10 attempts, add timestamp
  const timestamp = Date.now().toString(36).toUpperCase().slice(-3);
  let code = '';
  for (let i = 0; i < 2; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MARIE-${code}${timestamp}`;
}

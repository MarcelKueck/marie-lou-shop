import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, passwordResetTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Find customer by email
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, email.toLowerCase()),
    });
    
    // Always return success to prevent email enumeration
    if (!customer) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ success: true });
    }
    
    // Check if customer has a password set (can't reset if they've never set one)
    if (!customer.passwordHash) {
      console.log(`Password reset requested for customer without password: ${email}`);
      return NextResponse.json({ success: true });
    }
    
    // Generate reset token
    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    
    // Store token in database
    await db.insert(passwordResetTokens).values({
      id: crypto.randomUUID(),
      customerId: customer.id,
      token,
      expiresAt,
      createdAt: now,
    });
    
    // Send reset email
    const result = await sendPasswordResetEmail(
      customer.email,
      token,
      'de', // Default to German
      'coffee' // Default brand
    );
    
    if (!result.success) {
      console.error(`Failed to send password reset email to ${email}: ${result.error}`);
      // Still return success to prevent enumeration
    } else {
      console.log(`Password reset email sent to ${email}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

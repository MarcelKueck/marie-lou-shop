import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, referralCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, createSession } from '@/lib/auth';
import { generateReferralCode } from '@/lib/referral-server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if customer already exists with a password
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.email, email.toLowerCase()),
    });

    const now = new Date();
    let customerId: string;

    if (existingCustomer) {
      // Customer exists from a previous order
      if (existingCustomer.passwordHash) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please login instead.' },
          { status: 409 }
        );
      }

      // Update existing customer with password
      const passwordHash = await hashPassword(password);
      await db.update(customers)
        .set({
          passwordHash,
          firstName: firstName || existingCustomer.firstName,
          lastName: lastName || existingCustomer.lastName,
          updatedAt: now,
        })
        .where(eq(customers.id, existingCustomer.id));
      
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const passwordHash = await hashPassword(password);
      customerId = crypto.randomUUID();

      await db.insert(customers).values({
        id: customerId,
        email: email.toLowerCase(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Check if customer already has a referral code
    const existingCode = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.customerId, customerId),
    });

    if (!existingCode) {
      // Create a referral code for the new account
      const code = await generateReferralCode();
      await db.insert(referralCodes).values({
        id: crypto.randomUUID(),
        customerId,
        code,
        active: true,
        createdAt: now,
      });
    }

    // Create session
    const sessionToken = await createSession(customerId);

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
    });

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bWaitlistLeads } from '@/db/schema';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyName,
      contactName,
      email,
      phone,
      teamSize,
      currentSolution,
      interestLevel,
      preferredStart,
      message,
    } = body;

    // Validate required fields
    if (!companyName || !contactName || !email || !teamSize || !currentSolution || !interestLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create waitlist lead
    const id = randomUUID();
    await db.insert(b2bWaitlistLeads).values({
      id,
      companyName,
      contactName,
      email,
      phone: phone || null,
      teamSize,
      currentSolution,
      interestLevel,
      preferredStart: preferredStart || null,
      message: message || null,
      status: 'new',
      createdAt: new Date(),
    });

    // TODO: Send confirmation email to the lead
    // TODO: Send notification to admin

    return NextResponse.json({
      success: true,
      message: 'Thank you for your interest! We will contact you soon.',
    });
  } catch (error) {
    console.error('Failed to create waitlist lead:', error);
    return NextResponse.json(
      { error: 'Failed to submit. Please try again.' },
      { status: 500 }
    );
  }
}

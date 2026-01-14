import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies } from '@/db/schema';
import { generatePromoCode } from '@/lib/b2b-auth';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      companyName,
      contactFirstName,
      contactLastName,
      contactEmail,
      contactPhone,
      employeeCount,
      preferredTier,
      preferredBrand,
      currentSolution,
      message,
    } = body;

    // Validate required fields
    if (!companyName || !contactFirstName || !contactLastName || !contactEmail || !employeeCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingCompany = await db
      .select()
      .from(b2bCompanies)
      .where(eq(b2bCompanies.contactEmail, contactEmail.toLowerCase()))
      .limit(1);

    if (existingCompany.length > 0) {
      return NextResponse.json(
        { error: 'A company with this email already exists' },
        { status: 409 }
      );
    }

    // Generate unique promo code
    let promoCode = generatePromoCode(companyName);
    
    // Ensure promo code is unique
    const existingPromoCode = await db
      .select()
      .from(b2bCompanies)
      .where(eq(b2bCompanies.promoCode, promoCode))
      .limit(1);
    
    if (existingPromoCode.length > 0) {
      // Add random suffix if code exists
      promoCode = `${promoCode}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    }

    // Determine initial tier based on preference
    const tier = preferredTier === 'flex' ? 'flex' : 'smart_starter';

    const now = new Date();
    const companyId = crypto.randomUUID();

    // Create company record
    await db.insert(b2bCompanies).values({
      id: companyId,
      companyName,
      contactFirstName,
      contactLastName,
      contactEmail: contactEmail.toLowerCase(),
      contactPhone: contactPhone || null,
      employeeCount: parseInt(employeeCount) || null,
      tier,
      status: 'inquiry',
      promoCode,
      preferredBrand: preferredBrand || 'coffee',
      currentCoffeeSolution: currentSolution || null,
      inquiryMessage: message || null,
      createdAt: now,
      updatedAt: now,
    });

    // TODO: Send notification email to admin
    // TODO: Send confirmation email to contact

    console.log(`New B2B inquiry created: ${companyName} (${companyId})`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Inquiry submitted successfully',
        companyId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating B2B inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}

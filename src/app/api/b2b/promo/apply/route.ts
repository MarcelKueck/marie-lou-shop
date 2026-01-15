import { NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies, b2bPromoUsage } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * B2B Promo Code Application API
 * POST /api/b2b/promo/apply
 * 
 * Validates and applies B2B employee promo codes to D2C orders
 */

interface PromoApplyRequest {
  code: string;
  email: string;
  cartTotal: number; // in cents
}

interface PromoApplyResponse {
  valid: boolean;
  code?: string;
  companyName?: string;
  discountPercent?: number;
  discountAmount?: number; // in cents
  newTotal?: number; // in cents
  error?: string;
  message?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as PromoApplyRequest;
    
    // Validate required fields
    if (!body.code || !body.email || body.cartTotal === undefined) {
      return NextResponse.json<PromoApplyResponse>(
        { valid: false, error: 'Missing required fields: code, email, cartTotal' },
        { status: 400 }
      );
    }
    
    const code = body.code.toUpperCase().trim();
    const email = body.email.toLowerCase().trim();
    
    // Find company with this promo code
    const company = await db
      .select()
      .from(b2bCompanies)
      .where(
        and(
          eq(b2bCompanies.promoCode, code),
          eq(b2bCompanies.status, 'active')
        )
      )
      .limit(1);
    
    if (!company[0]) {
      return NextResponse.json<PromoApplyResponse>(
        { 
          valid: false, 
          error: 'Invalid or expired promo code',
          message: 'This promo code is not valid. Please check the code and try again.'
        },
        { status: 400 }
      );
    }
    
    const b2bCompany = company[0];
    
    // Check if this email has already used this promo code
    const existingUsage = await db
      .select()
      .from(b2bPromoUsage)
      .where(
        and(
          eq(b2bPromoUsage.companyId, b2bCompany.id),
          eq(b2bPromoUsage.customerEmail, email)
        )
      )
      .limit(1);
    
    // Allow multiple uses per email, but track for analytics
    const isFirstUse = !existingUsage[0];
    
    // Calculate discount
    const discountPercent = b2bCompany.promoDiscountPercent || 10;
    const discountAmount = Math.round(body.cartTotal * (discountPercent / 100));
    const newTotal = body.cartTotal - discountAmount;
    
    // Create promo validation token for checkout
    const validationToken = Buffer.from(
      JSON.stringify({
        code,
        companyId: b2bCompany.id,
        email,
        discountPercent,
        discountAmount,
        cartTotal: body.cartTotal,
        timestamp: Date.now(),
      })
    ).toString('base64');
    
    return NextResponse.json<PromoApplyResponse & { validationToken?: string; isFirstUse?: boolean }>({
      valid: true,
      code,
      companyName: b2bCompany.companyName,
      discountPercent,
      discountAmount,
      newTotal,
      validationToken,
      isFirstUse,
      message: isFirstUse 
        ? `Welcome! Enjoy ${discountPercent}% off your order courtesy of ${b2bCompany.companyName}!`
        : `${discountPercent}% discount applied from ${b2bCompany.companyName}`,
    });
  } catch (error) {
    console.error('Promo apply error:', error);
    return NextResponse.json<PromoApplyResponse>(
      { valid: false, error: 'Failed to apply promo code' },
      { status: 500 }
    );
  }
}

// GET endpoint for quick code validation
export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Code parameter required' },
        { status: 400 }
      );
    }
    
    const normalizedCode = code.toUpperCase().trim();
    
    // Find company with this promo code
    const company = await db
      .select({
        id: b2bCompanies.id,
        companyName: b2bCompanies.companyName,
        promoCode: b2bCompanies.promoCode,
        discountPercent: b2bCompanies.promoDiscountPercent,
        status: b2bCompanies.status,
      })
      .from(b2bCompanies)
      .where(eq(b2bCompanies.promoCode, normalizedCode))
      .limit(1);
    
    if (!company[0]) {
      return NextResponse.json({
        valid: false,
        error: 'Code not found',
      });
    }
    
    const b2bCompany = company[0];
    
    if (b2bCompany.status !== 'active') {
      return NextResponse.json({
        valid: false,
        error: 'This company\'s promo code is no longer active',
      });
    }
    
    return NextResponse.json({
      valid: true,
      code: normalizedCode,
      companyName: b2bCompany.companyName,
      discountPercent: b2bCompany.discountPercent || 10,
    });
  } catch (error) {
    console.error('Promo validate error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate code' },
      { status: 500 }
    );
  }
}

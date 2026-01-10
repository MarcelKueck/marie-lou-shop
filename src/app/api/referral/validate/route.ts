import { NextRequest, NextResponse } from 'next/server';
import { isValidReferralCodeFormat, REFERRAL_DISCOUNT_PERCENT } from '@/lib/referral';
import { db } from '@/db';
import { referralCodes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/referral/validate?code=MARIE-XXXXX
 * Validate a referral code
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Code is required' },
        { status: 400 }
      );
    }

    // Check format
    if (!isValidReferralCodeFormat(code)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid code format' },
        { status: 400 }
      );
    }

    // Check if code exists in database and is active
    const referralCode = await db.query.referralCodes.findFirst({
      where: and(
        eq(referralCodes.code, code.toUpperCase()),
        eq(referralCodes.active, true)
      ),
    });
    
    if (!referralCode) {
      return NextResponse.json(
        { valid: false, error: 'Code not found or inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: code.toUpperCase(),
      discount: REFERRAL_DISCOUNT_PERCENT,
      message: 'Referral code validated successfully',
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { referralCodes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { isValidReferralCodeFormat, REFERRAL_DISCOUNT_PERCENT } from '@/lib/referral';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/referral/validate/[code]
 * Validate a referral code (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { code } = await params;

    if (!code || !isValidReferralCodeFormat(code)) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid referral code format',
      });
    }

    const referralCode = await db.query.referralCodes.findFirst({
      where: and(
        eq(referralCodes.code, code.toUpperCase()),
        eq(referralCodes.active, true)
      ),
    });

    if (!referralCode) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid or expired referral code',
      });
    }

    return NextResponse.json({
      valid: true,
      discountPercent: REFERRAL_DISCOUNT_PERCENT,
      message: `You'll get ${REFERRAL_DISCOUNT_PERCENT}% off your first order!`,
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    return NextResponse.json({
      valid: false,
      message: 'Error validating code',
    }, { status: 500 });
  }
}

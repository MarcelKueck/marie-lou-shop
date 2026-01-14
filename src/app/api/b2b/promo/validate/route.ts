import { NextRequest, NextResponse } from 'next/server';
import { validateB2BPromoCode } from '@/lib/b2b-auth';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Promo code is required' },
        { status: 400 }
      );
    }
    
    const result = await validateB2BPromoCode(code);
    
    if (!result.valid || !result.company) {
      return NextResponse.json(
        { valid: false, error: result.error || 'Invalid promo code' },
        { status: 404 }
      );
    }
    
    const company = result.company;
    
    return NextResponse.json({
      valid: true,
      promoCode: company.promoCode,
      companyName: company.companyName,
      discount: result.discountPercent,
      tier: company.tier,
      brandPreference: company.preferredBrand,
    });
    
  } catch (error) {
    console.error('Promo validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate code' },
      { status: 500 }
    );
  }
}

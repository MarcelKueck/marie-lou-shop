import { NextRequest, NextResponse } from 'next/server';
import { validateGiftCard } from '@/lib/gift-cards';

// POST /api/gift-cards/validate
// Validate a gift card code and return its balance
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      );
    }
    
    const result = await validateGiftCard(code);
    
    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 200 } // Return 200 so frontend can read the error message
      );
    }
    
    return NextResponse.json({
      valid: true,
      giftCard: result.giftCard,
    });
  } catch (error) {
    console.error('Gift card validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate gift card' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // Return placeholder info
  return NextResponse.json({ success: true, message: 'Invoices API placeholder' });
}

export async function POST(request: NextRequest) {
  // In production: generate invoice for order
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ success: true, message: 'Invoice creation placeholder', body });
}

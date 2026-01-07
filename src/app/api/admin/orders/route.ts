import { NextResponse } from 'next/server';

export async function GET() {
  // Minimal placeholder: in production, add auth and DB query
  return NextResponse.json({
    success: true,
    message: 'Orders API placeholder - implement DB query and auth',
  });
}

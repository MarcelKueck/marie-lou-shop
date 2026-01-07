import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
  return NextResponse.json({ success: true, message: `Order ${id} placeholder` });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
  // Minimal PATCH placeholder
  return NextResponse.json({ success: true, message: `Order ${id} updated (placeholder)` });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
  return NextResponse.json({ success: true, message: `Order ${id} deleted (placeholder)` });
}

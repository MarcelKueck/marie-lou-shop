import { NextRequest, NextResponse } from 'next/server';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { smartBoxes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string }> }
) {
  const company = await getCurrentB2BCompany();
  
  if (!company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (company.tier !== 'smart') {
    return NextResponse.json({ error: 'SmartBox is only available for Smart tier' }, { status: 403 });
  }
  
  const { boxId } = await params;
  
  try {
    // Verify the box belongs to this company
    const box = await db
      .select()
      .from(smartBoxes)
      .where(
        and(
          eq(smartBoxes.id, boxId),
          eq(smartBoxes.companyId, company.id)
        )
      )
      .limit(1);
    
    if (box.length === 0) {
      return NextResponse.json({ error: 'SmartBox not found' }, { status: 404 });
    }
    
    return NextResponse.json({ box: box[0] });
  } catch (error) {
    console.error('Failed to fetch SmartBox:', error);
    return NextResponse.json({ error: 'Failed to fetch SmartBox' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string }> }
) {
  const company = await getCurrentB2BCompany();
  
  if (!company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (company.tier !== 'smart') {
    return NextResponse.json({ error: 'SmartBox is only available for Smart tier' }, { status: 403 });
  }
  
  const { boxId } = await params;
  const body = await request.json();
  
  try {
    // Verify the box belongs to this company
    const existingBox = await db
      .select()
      .from(smartBoxes)
      .where(
        and(
          eq(smartBoxes.id, boxId),
          eq(smartBoxes.companyId, company.id)
        )
      )
      .limit(1);
    
    if (existingBox.length === 0) {
      return NextResponse.json({ error: 'SmartBox not found' }, { status: 404 });
    }
    
    // Only allow updating threshold and location
    const updateData: Partial<{ reorderThresholdPercent: number; locationDescription: string }> = {};
    
    if (typeof body.threshold === 'number' && body.threshold >= 5 && body.threshold <= 50) {
      updateData.reorderThresholdPercent = body.threshold;
    }
    
    if (typeof body.location === 'string') {
      updateData.locationDescription = body.location;
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    await db
      .update(smartBoxes)
      .set(updateData)
      .where(eq(smartBoxes.id, boxId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update SmartBox:', error);
    return NextResponse.json({ error: 'Failed to update SmartBox' }, { status: 500 });
  }
}

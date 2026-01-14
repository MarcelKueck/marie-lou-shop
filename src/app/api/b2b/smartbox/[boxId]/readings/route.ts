import { NextRequest, NextResponse } from 'next/server';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { smartBoxes, boxReadings } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

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
    
    // Get readings from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const readings = await db
      .select({
        id: boxReadings.id,
        fillPercent: boxReadings.fillPercent,
        recordedAt: boxReadings.recordedAt,
      })
      .from(boxReadings)
      .where(
        and(
          eq(boxReadings.boxId, boxId),
          gte(boxReadings.recordedAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(boxReadings.recordedAt))
      .limit(100);
    
    return NextResponse.json({ readings });
  } catch (error) {
    console.error('Failed to fetch readings:', error);
    return NextResponse.json({ error: 'Failed to fetch readings' }, { status: 500 });
  }
}

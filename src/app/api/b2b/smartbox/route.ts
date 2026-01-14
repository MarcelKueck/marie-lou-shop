import { NextResponse } from 'next/server';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { smartBoxes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const company = await getCurrentB2BCompany();
  
  if (!company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (company.tier !== 'smart') {
    return NextResponse.json({ error: 'SmartBox is only available for Smart tier' }, { status: 403 });
  }
  
  try {
    // Get all SmartBoxes for this company
    const boxes = await db
      .select({
        id: smartBoxes.id,
        deviceId: smartBoxes.deviceId,
        currentProductId: smartBoxes.currentProductId,
        currentProductName: smartBoxes.currentProductName,
        status: smartBoxes.status,
        threshold: smartBoxes.reorderThresholdPercent,
        locationDescription: smartBoxes.locationDescription,
        currentFillPercent: smartBoxes.currentFillPercent,
        lastReadingAt: smartBoxes.lastReadingAt,
        size: smartBoxes.size,
        capacityKg: smartBoxes.capacityKg,
      })
      .from(smartBoxes)
      .where(eq(smartBoxes.companyId, company.id));
    
    // Format response
    const formattedBoxes = boxes.map(box => ({
      id: box.id,
      serialNumber: box.deviceId,
      productId: box.currentProductId || '',
      productName: box.currentProductName || 'Not assigned',
      currentFillPercent: box.currentFillPercent ?? 100,
      status: box.status as 'active' | 'inactive' | 'maintenance',
      threshold: box.threshold ?? 20,
      lastReading: box.lastReadingAt?.toISOString() ?? null,
      location: box.locationDescription,
      size: box.size,
      capacityKg: box.capacityKg,
    }));
    
    return NextResponse.json({ boxes: formattedBoxes });
  } catch (error) {
    console.error('Failed to fetch SmartBoxes:', error);
    return NextResponse.json({ error: 'Failed to fetch SmartBoxes' }, { status: 500 });
  }
}

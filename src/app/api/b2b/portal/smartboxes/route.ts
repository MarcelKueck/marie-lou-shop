import { NextResponse } from 'next/server';
import { db } from '@/db';
import { smartBoxes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';

/**
 * B2B Portal SmartBoxes API
 * GET /api/b2b/portal/smartboxes
 * 
 * Retrieves all SmartBoxes for the current company
 */

export async function GET(request: Request) {
  try {
    // Get current company from session
    const company = await getCurrentB2BCompany();
    
    if (!company) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Allow query param override for admin access
    const { searchParams } = new URL(request.url);
    const queryCompanyId = searchParams.get('companyId');
    
    // Use session company ID unless admin override
    const companyId = queryCompanyId === company.id ? company.id : company.id;
    
    // Fetch SmartBoxes for the company
    const boxes = await db
      .select()
      .from(smartBoxes)
      .where(eq(smartBoxes.companyId, companyId));
    
    // Transform to API response format
    const formattedBoxes = boxes.map((box) => ({
      id: box.id,
      deviceId: box.deviceId,
      name: box.currentProductName || `SmartBox ${box.size}`,
      location: box.locationDescription,
      size: box.size,
      productName: box.currentProductName,
      status: box.status,
      fillPercent: box.currentFillPercent || 0,
      batteryPercent: box.currentBatteryPercent,
      lastReading: box.lastReadingAt?.toISOString(),
      capacityKg: box.capacityKg,
    }));
    
    // Calculate summary stats
    const activeBoxes = formattedBoxes.filter(b => b.status === 'active');
    const lowBoxes = activeBoxes.filter(b => b.fillPercent <= 30);
    const avgFill = activeBoxes.length > 0
      ? activeBoxes.reduce((sum, b) => sum + b.fillPercent, 0) / activeBoxes.length
      : 0;
    
    return NextResponse.json({
      boxes: formattedBoxes,
      summary: {
        total: formattedBoxes.length,
        active: activeBoxes.length,
        lowStock: lowBoxes.length,
        avgFillPercent: Math.round(avgFill),
      },
    });
  } catch (error) {
    console.error('SmartBoxes fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SmartBoxes' },
      { status: 500 }
    );
  }
}

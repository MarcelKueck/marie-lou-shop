import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { smartBoxes, b2bCompanies } from '@/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const conditions = [];
    if (status) conditions.push(eq(smartBoxes.status, status as 'provisioned' | 'active' | 'offline' | 'maintenance' | 'decommissioned'));

    const boxes = await db.select({
      id: smartBoxes.id,
      companyId: smartBoxes.companyId,
      companyName: b2bCompanies.companyName,
      deviceId: smartBoxes.deviceId,
      currentProductId: smartBoxes.currentProductId,
      currentProductName: smartBoxes.currentProductName,
      locationDescription: smartBoxes.locationDescription,
      status: smartBoxes.status,
      currentFillPercent: smartBoxes.currentFillPercent,
      currentWeightGrams: smartBoxes.currentWeightGrams,
      lastReadingAt: smartBoxes.lastReadingAt,
      reorderThresholdPercent: smartBoxes.reorderThresholdPercent,
      autoReorderEnabled: smartBoxes.autoReorderEnabled,
      createdAt: smartBoxes.createdAt,
    })
    .from(smartBoxes)
    .leftJoin(b2bCompanies, eq(smartBoxes.companyId, b2bCompanies.id))
    .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
    .orderBy(desc(smartBoxes.createdAt))
    .limit(100);

    return NextResponse.json({ boxes });
  } catch (error) {
    console.error('Error fetching SmartBoxes:', error);
    return NextResponse.json({ error: 'Failed to fetch SmartBoxes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { companyId, deviceId, locationDescription } = body;

    if (!companyId || !deviceId) {
      return NextResponse.json({ error: 'companyId and deviceId are required' }, { status: 400 });
    }

    // Verify company exists and is approved Smart tier
    const company = await db.query.b2bCompanies.findFirst({
      where: eq(b2bCompanies.id, companyId),
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.tier !== 'smart') {
      return NextResponse.json({ error: 'Company must be on Smart tier to provision SmartBoxes' }, { status: 400 });
    }

    // Check for duplicate device ID
    const existingBox = await db.query.smartBoxes.findFirst({
      where: eq(smartBoxes.deviceId, deviceId),
    });

    if (existingBox) {
      return NextResponse.json({ error: 'Device ID already exists' }, { status: 400 });
    }

    const [newBox] = await db.insert(smartBoxes).values({
      id: crypto.randomUUID(),
      companyId,
      deviceId,
      locationDescription: locationDescription || null,
      status: 'provisioned',
      reorderThresholdPercent: 20,
      autoReorderEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ box: newBox }, { status: 201 });
  } catch (error) {
    console.error('Error creating SmartBox:', error);
    return NextResponse.json({ error: 'Failed to create SmartBox' }, { status: 500 });
  }
}

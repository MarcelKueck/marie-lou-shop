import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { smartBoxes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { boxId } = await params;
    
    const box = await db.query.smartBoxes.findFirst({
      where: eq(smartBoxes.id, boxId),
      with: {
        company: true,
        readings: {
          limit: 10,
          orderBy: (readings, { desc }) => [desc(readings.recordedAt)],
        },
      },
    });

    if (!box) {
      return NextResponse.json({ error: 'SmartBox not found' }, { status: 404 });
    }

    return NextResponse.json({ box });
  } catch (error) {
    console.error('Error fetching SmartBox:', error);
    return NextResponse.json({ error: 'Failed to fetch SmartBox' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boxId: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { boxId } = await params;
    const body = await request.json();
    const { status, locationDescription, reorderThresholdPercent, autoReorderEnabled } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateData.status = status;
    if (locationDescription !== undefined) updateData.locationDescription = locationDescription;
    if (reorderThresholdPercent !== undefined) updateData.reorderThresholdPercent = reorderThresholdPercent;
    if (autoReorderEnabled !== undefined) updateData.autoReorderEnabled = autoReorderEnabled;

    const [updated] = await db.update(smartBoxes)
      .set(updateData)
      .where(eq(smartBoxes.id, boxId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'SmartBox not found' }, { status: 404 });
    }

    return NextResponse.json({ box: updated });
  } catch (error) {
    console.error('Error updating SmartBox:', error);
    return NextResponse.json({ error: 'Failed to update SmartBox' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { db } from '@/db';
import { b2bHolidayPeriods } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ holidayId: string }>;
}

/**
 * Delete a holiday period
 * DELETE /api/b2b/portal/holidays/[holidayId]
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const company = await getCurrentB2BCompany();
    if (!company) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { holidayId } = await params;

    // Verify the holiday belongs to this company
    const holiday = await db.query.b2bHolidayPeriods.findFirst({
      where: and(
        eq(b2bHolidayPeriods.id, holidayId),
        eq(b2bHolidayPeriods.companyId, company.id)
      ),
    });

    if (!holiday) {
      return NextResponse.json(
        { error: 'Holiday period not found' },
        { status: 404 }
      );
    }

    // Delete the holiday
    await db.delete(b2bHolidayPeriods)
      .where(eq(b2bHolidayPeriods.id, holidayId));

    return NextResponse.json({
      success: true,
      message: 'Holiday period deleted successfully',
    });
  } catch (error) {
    console.error('Delete holiday period error:', error);
    return NextResponse.json(
      { error: 'Failed to delete holiday period' },
      { status: 500 }
    );
  }
}

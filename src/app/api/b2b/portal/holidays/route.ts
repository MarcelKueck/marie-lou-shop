import { NextResponse } from 'next/server';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { createHolidayPeriod } from '@/lib/smartbox-algorithm';

/**
 * Create a holiday period
 * POST /api/b2b/portal/holidays
 */
export async function POST(request: Request) {
  try {
    const company = await getCurrentB2BCompany();
    if (!company) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, reason, boxId } = body;

    // Validate required fields
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create holiday period
    const holidayId = await createHolidayPeriod(
      company.id,
      start,
      end,
      reason || null,
      boxId || undefined,
      company.contactFirstName + ' ' + company.contactLastName
    );

    return NextResponse.json({
      success: true,
      holidayId,
      message: 'Holiday period created successfully',
    });
  } catch (error) {
    console.error('Create holiday period error:', error);
    return NextResponse.json(
      { error: 'Failed to create holiday period' },
      { status: 500 }
    );
  }
}

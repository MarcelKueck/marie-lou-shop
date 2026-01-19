import { NextResponse, NextRequest } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { resolveAlert } from '@/lib/smartbox-algorithm';

interface RouteParams {
  params: Promise<{ alertId: string }>;
}

/**
 * Resolve an alert
 * POST /api/admin/b2b/alerts/[alertId]/resolve
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { alertId } = await params;
    const body = await request.json();
    const { notes } = body;

    await resolveAlert(alertId, 'Admin', notes);

    return NextResponse.json({
      success: true,
      message: 'Alert resolved successfully',
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}

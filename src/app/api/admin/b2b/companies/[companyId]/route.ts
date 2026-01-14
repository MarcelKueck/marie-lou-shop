import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { companyId } = await params;
    
    const company = await db.query.b2bCompanies.findFirst({
      where: eq(b2bCompanies.id, companyId),
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Error fetching B2B company:', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { companyId } = await params;
    const body = await request.json();
    const { tier, status, discountPercent, paymentTermDays, creditLimitCents, notes } = body;

    const [updated] = await db.update(b2bCompanies)
      .set({
        tier,
        status,
        discountPercent,
        paymentTermDays,
        creditLimitCents,
        notes,
        updatedAt: new Date(),
        ...(status === 'approved' && { approvedAt: new Date() }),
      })
      .where(eq(b2bCompanies.id, companyId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company: updated });
  } catch (error) {
    console.error('Error updating B2B company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');

    const conditions = [];
    if (status) conditions.push(eq(b2bCompanies.status, status as 'pending' | 'approved' | 'rejected' | 'suspended'));
    if (tier) conditions.push(eq(b2bCompanies.tier, tier as 'flex' | 'smart'));

    const companies = await db.query.b2bCompanies.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(b2bCompanies.createdAt)],
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Error fetching B2B companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

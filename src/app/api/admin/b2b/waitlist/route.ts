import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bWaitlistLeads } from '@/db/schema';
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
    if (status) conditions.push(eq(b2bWaitlistLeads.status, status as 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'));

    const leads = await db.select()
      .from(b2bWaitlistLeads)
      .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
      .orderBy(desc(b2bWaitlistLeads.createdAt))
      .limit(200);

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching waitlist leads:', error);
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }
}

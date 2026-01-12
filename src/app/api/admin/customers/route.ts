import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { desc, like, or, sql } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build query with order stats
    let query = db.select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      phone: customers.phone,
      stripeCustomerId: customers.stripeCustomerId,
      marketingOptIn: customers.marketingOptIn,
      referralTrusted: customers.referralTrusted,
      referralSuspended: customers.referralSuspended,
      referralNotes: customers.referralNotes,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      orderCount: sql<number>`(SELECT COUNT(*) FROM orders WHERE orders.customer_id = ${customers.id})`,
      totalSpent: sql<number>`(SELECT COALESCE(SUM(total), 0) FROM orders WHERE orders.customer_id = ${customers.id} AND orders.payment_status = 'paid')`,
    }).from(customers);

    if (search) {
      const searchPattern = `%${search}%`;
      query = query.where(
        or(
          like(customers.email, searchPattern),
          like(customers.firstName, searchPattern),
          like(customers.lastName, searchPattern),
          like(customers.phone, searchPattern)
        )
      ) as typeof query;
    }

    const rows = await query
      .orderBy(desc(customers.createdAt))
      .limit(100);

    return NextResponse.json({
      customers: rows.map(c => ({
        ...c,
        createdAt: c.createdAt?.toISOString(),
        updatedAt: c.updatedAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

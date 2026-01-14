import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bOrders, b2bCompanies } from '@/db/schema';
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
    const paymentStatus = searchParams.get('paymentStatus');

    const conditions = [];
    if (status) conditions.push(eq(b2bOrders.status, status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'));
    if (paymentStatus) conditions.push(eq(b2bOrders.paymentStatus, paymentStatus as 'pending' | 'invoiced' | 'paid' | 'overdue'));

    const orders = await db.select({
      id: b2bOrders.id,
      orderNumber: b2bOrders.orderNumber,
      companyId: b2bOrders.companyId,
      companyName: b2bCompanies.companyName,
      status: b2bOrders.status,
      subtotalCents: b2bOrders.subtotalCents,
      discountCents: b2bOrders.discountCents,
      shippingCents: b2bOrders.shippingCents,
      totalCents: b2bOrders.totalCents,
      paymentStatus: b2bOrders.paymentStatus,
      paymentDueDate: b2bOrders.paymentDueDate,
      shippingAddressJson: b2bOrders.shippingAddressJson,
      trackingNumber: b2bOrders.trackingNumber,
      notes: b2bOrders.notes,
      createdAt: b2bOrders.createdAt,
    })
    .from(b2bOrders)
    .leftJoin(b2bCompanies, eq(b2bOrders.companyId, b2bCompanies.id))
    .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
    .orderBy(desc(b2bOrders.createdAt))
    .limit(100);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching B2B orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

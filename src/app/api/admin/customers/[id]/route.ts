import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/admin-auth';

// GET - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      customer: {
        ...customer,
        createdAt: customer.createdAt?.toISOString(),
        updatedAt: customer.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// PUT - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Check if customer exists
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const {
      firstName,
      lastName,
      phone,
      marketingOptIn,
      referralTrusted,
      referralSuspended,
      referralNotes,
    } = body;

    // Update customer
    await db.update(customers)
      .set({
        firstName: firstName !== undefined ? firstName : existingCustomer.firstName,
        lastName: lastName !== undefined ? lastName : existingCustomer.lastName,
        phone: phone !== undefined ? phone : existingCustomer.phone,
        marketingOptIn: marketingOptIn !== undefined ? marketingOptIn : existingCustomer.marketingOptIn,
        referralTrusted: referralTrusted !== undefined ? referralTrusted : existingCustomer.referralTrusted,
        referralSuspended: referralSuspended !== undefined ? referralSuspended : existingCustomer.referralSuspended,
        referralNotes: referralNotes !== undefined ? referralNotes : existingCustomer.referralNotes,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));

    // Fetch updated customer
    const updatedCustomer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    return NextResponse.json({
      customer: {
        ...updatedCustomer,
        createdAt: updatedCustomer?.createdAt?.toISOString(),
        updatedAt: updatedCustomer?.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE - Delete customer (with confirmation required)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if customer exists
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Note: In production, you might want to soft-delete or check for related orders
    await db.delete(customers).where(eq(customers.id, id));

    return NextResponse.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}

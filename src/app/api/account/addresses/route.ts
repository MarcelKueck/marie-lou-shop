import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { addresses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentCustomer } from '@/lib/auth';

// GET - Get all addresses for current customer
export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const customerAddresses = await db.query.addresses.findMany({
      where: eq(addresses.customerId, customer.id),
      orderBy: (addresses, { desc }) => [desc(addresses.isDefault), desc(addresses.createdAt)],
    });

    return NextResponse.json({ addresses: customerAddresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json({ error: 'Failed to get addresses' }, { status: 500 });
  }
}

// POST - Create new address
export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      firstName,
      lastName,
      company,
      line1,
      line2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = body;

    // Validate required fields
    if (!type || !firstName || !lastName || !line1 || !city || !postalCode || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date();
    const addressId = crypto.randomUUID();

    // If this is set as default, unset other defaults of same type
    if (isDefault) {
      await db.update(addresses)
        .set({ isDefault: false, updatedAt: now })
        .where(and(
          eq(addresses.customerId, customer.id),
          eq(addresses.type, type)
        ));
    }

    await db.insert(addresses).values({
      id: addressId,
      customerId: customer.id,
      type,
      firstName,
      lastName,
      company: company || null,
      line1,
      line2: line2 || null,
      city,
      state: state || null,
      postalCode,
      country,
      isDefault: isDefault || false,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, addressId });
  } catch (error) {
    console.error('Create address error:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}

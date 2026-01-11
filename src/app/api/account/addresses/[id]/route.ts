import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { addresses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentCustomer } from '@/lib/auth';

// GET - Get single address
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const address = await db.query.addresses.findFirst({
      where: and(
        eq(addresses.id, id),
        eq(addresses.customerId, customer.id)
      ),
    });

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Get address error:', error);
    return NextResponse.json({ error: 'Failed to get address' }, { status: 500 });
  }
}

// PATCH - Update address
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await db.query.addresses.findFirst({
      where: and(
        eq(addresses.id, id),
        eq(addresses.customerId, customer.id)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const now = new Date();
    const updates: Record<string, unknown> = { updatedAt: now };

    // Only update provided fields
    if (body.type !== undefined) updates.type = body.type;
    if (body.firstName !== undefined) updates.firstName = body.firstName;
    if (body.lastName !== undefined) updates.lastName = body.lastName;
    if (body.company !== undefined) updates.company = body.company || null;
    if (body.line1 !== undefined) updates.line1 = body.line1;
    if (body.line2 !== undefined) updates.line2 = body.line2 || null;
    if (body.city !== undefined) updates.city = body.city;
    if (body.state !== undefined) updates.state = body.state || null;
    if (body.postalCode !== undefined) updates.postalCode = body.postalCode;
    if (body.country !== undefined) updates.country = body.country;

    // Handle isDefault
    if (body.isDefault) {
      const type = body.type || existing.type;
      // Unset other defaults of same type
      await db.update(addresses)
        .set({ isDefault: false, updatedAt: now })
        .where(and(
          eq(addresses.customerId, customer.id),
          eq(addresses.type, type)
        ));
      updates.isDefault = true;
    } else if (body.isDefault === false) {
      updates.isDefault = false;
    }

    await db.update(addresses)
      .set(updates)
      .where(eq(addresses.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE - Delete address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await db.query.addresses.findFirst({
      where: and(
        eq(addresses.id, id),
        eq(addresses.customerId, customer.id)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    await db.delete(addresses).where(eq(addresses.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}

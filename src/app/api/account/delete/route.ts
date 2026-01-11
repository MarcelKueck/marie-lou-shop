import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, orders, addresses, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentCustomer, logout } from '@/lib/auth';

export async function DELETE() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Note: In a real app, you might want to:
    // 1. Anonymize orders instead of keeping customer reference
    // 2. Delete personal data but keep order history for legal/tax reasons
    // 3. Send confirmation email
    // 4. Implement a grace period for recovery

    // Delete addresses
    await db.delete(addresses).where(eq(addresses.customerId, customer.id));

    // Delete sessions
    await db.delete(sessions).where(eq(sessions.customerId, customer.id));

    // Anonymize orders (keep for records but remove personal data)
    await db.update(orders)
      .set({
        customerId: null,
        // Keep shipping/billing info for legal requirements
        // But you might want to anonymize these after retention period
      })
      .where(eq(orders.customerId, customer.id));

    // Delete customer
    await db.delete(customers).where(eq(customers.id, customer.id));

    // Logout (clear session cookie)
    await logout();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

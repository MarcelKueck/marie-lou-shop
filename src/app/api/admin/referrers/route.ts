import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, referrals, orders, referralCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Admin auth check
function isAdminAuthenticated(request: NextRequest): boolean {
  const adminSession = request.cookies.get('admin_session')?.value;
  return adminSession !== undefined && adminSession.length > 0;
}

// GET - List all referrers with their stats (for admin review)
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'flagged', 'trusted', 'suspended', or 'all'

    // Get all referral codes
    const allReferralCodes = await db.select().from(referralCodes);

    const referrerStats = await Promise.all(
      allReferralCodes.map(async (code) => {
        // Get the customer for this referral code
        const customer = await db.query.customers.findFirst({
          where: eq(customers.id, code.customerId),
        });
        
        if (!customer) return null;

        // Get all referrals by this customer
        const customerReferrals = await db.select().from(referrals)
          .where(eq(referrals.referrerId, customer.id));

        // Count refunded orders
        let refundedCount = 0;
        const totalReferrals = customerReferrals.length;

        for (const referral of customerReferrals) {
          if (referral.qualifyingOrderId) {
            const order = await db.query.orders.findFirst({
              where: eq(orders.id, referral.qualifyingOrderId),
            });
            if (order?.status === 'refunded') {
              refundedCount++;
            }
          }
        }

        const refundRate = totalReferrals > 0 ? refundedCount / totalReferrals : 0;
        const isFlagged = totalReferrals >= 3 && refundRate >= 0.5;

        return {
          customerId: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          referralCode: code.code,
          totalReferrals,
          refundedCount,
          refundRate: Math.round(refundRate * 100),
          isFlagged,
          isTrusted: customer.referralTrusted || false,
          isSuspended: customer.referralSuspended || false,
          notes: customer.referralNotes,
        };
      })
    );

    // Filter out nulls and apply filter
    type ReferrerStat = {
      customerId: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      referralCode: string;
      totalReferrals: number;
      refundedCount: number;
      refundRate: number;
      isFlagged: boolean;
      isTrusted: boolean;
      isSuspended: boolean;
      notes: string | null;
    };
    
    let filtered = referrerStats.filter((r): r is ReferrerStat => r !== null);

    if (filter === 'flagged') {
      filtered = filtered.filter(r => r.isFlagged && !r.isTrusted && !r.isSuspended);
    } else if (filter === 'trusted') {
      filtered = filtered.filter(r => r.isTrusted);
    } else if (filter === 'suspended') {
      filtered = filtered.filter(r => r.isSuspended);
    }

    // Sort by refund rate descending
    filtered.sort((a, b) => b.refundRate - a.refundRate);

    return NextResponse.json({ referrers: filtered });
  } catch (error) {
    console.error('Error fetching referrers:', error);
    return NextResponse.json({ error: 'Failed to fetch referrers' }, { status: 500 });
  }
}

// POST - Update referrer trust status
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerId, action, notes } = body;

    if (!customerId || !action) {
      return NextResponse.json({ error: 'Missing customerId or action' }, { status: 400 });
    }

    const validActions = ['trust', 'untrust', 'suspend', 'unsuspend'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updates: {
      referralTrusted?: boolean;
      referralSuspended?: boolean;
      referralNotes?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    switch (action) {
      case 'trust':
        updates.referralTrusted = true;
        updates.referralSuspended = false; // Can't be both
        if (notes) updates.referralNotes = notes;
        break;
      case 'untrust':
        updates.referralTrusted = false;
        break;
      case 'suspend':
        updates.referralSuspended = true;
        updates.referralTrusted = false; // Can't be both
        if (notes) updates.referralNotes = notes;
        break;
      case 'unsuspend':
        updates.referralSuspended = false;
        break;
    }

    await db.update(customers)
      .set(updates)
      .where(eq(customers.id, customerId));

    return NextResponse.json({ 
      success: true, 
      message: `Customer ${action}ed successfully`,
      customerId,
      action,
    });
  } catch (error) {
    console.error('Error updating referrer status:', error);
    return NextResponse.json({ error: 'Failed to update referrer status' }, { status: 500 });
  }
}

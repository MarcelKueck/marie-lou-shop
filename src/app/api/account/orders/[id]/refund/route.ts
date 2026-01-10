import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { db } from '@/db';
import { orders, refundRequests, REFUND_REQUEST_STATUS } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'marie_lou_session';

// Refund reasons
const VALID_REASONS = [
  'not_satisfied',
  'damaged',
  'wrong_item',
  'never_arrived',
  'changed_mind',
  'other',
] as const;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params;
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const customer = await getCurrentCustomer(sessionToken);

    if (!customer) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the order (ensure it belongs to this customer)
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.customerId, customer.id)
      ),
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is eligible for refund (must be paid)
    if (order.paymentStatus !== 'paid') {
      return NextResponse.json(
        { error: 'Order is not eligible for refund' },
        { status: 400 }
      );
    }

    // Check if order is already refunded
    if (order.status === 'refunded') {
      return NextResponse.json(
        { error: 'Order has already been refunded' },
        { status: 400 }
      );
    }

    // Check if order is within refund window (14 days from payment)
    const paidAt = order.paidAt || order.createdAt;
    const daysSincePaid = Math.floor((Date.now() - paidAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSincePaid > 14) {
      return NextResponse.json(
        { error: 'Refund window has expired (14 days)' },
        { status: 400 }
      );
    }

    // Check if there's already a pending refund request
    const existingRequest = await db.query.refundRequests.findFirst({
      where: and(
        eq(refundRequests.orderId, orderId),
        eq(refundRequests.status, REFUND_REQUEST_STATUS.PENDING)
      ),
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A refund request is already pending for this order' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reason, reasonDetails } = body;

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid refund reason' },
        { status: 400 }
      );
    }

    // Create refund request
    const refundRequestId = crypto.randomUUID();
    const now = new Date();

    await db.insert(refundRequests).values({
      id: refundRequestId,
      orderId: order.id,
      customerId: customer.id,
      reason,
      reasonDetails: reasonDetails || null,
      requestedAmount: order.total, // Request full refund
      status: REFUND_REQUEST_STATUS.PENDING,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      refundRequestId,
      message: 'Refund request submitted successfully',
    });
  } catch (error) {
    console.error('Refund request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit refund request' },
      { status: 500 }
    );
  }
}

// Get refund request status for an order
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params;
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const customer = await getCurrentCustomer(sessionToken);

    if (!customer) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all refund requests for this order
    const requests = await db.query.refundRequests.findMany({
      where: and(
        eq(refundRequests.orderId, orderId),
        eq(refundRequests.customerId, customer.id)
      ),
    });

    return NextResponse.json({
      refundRequests: requests.map(r => ({
        id: r.id,
        reason: r.reason,
        reasonDetails: r.reasonDetails,
        requestedAmount: r.requestedAmount,
        approvedAmount: r.approvedAmount,
        status: r.status,
        adminNotes: r.adminNotes,
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt,
        processedAt: r.processedAt,
      })),
    });
  } catch (error) {
    console.error('Get refund requests error:', error);
    return NextResponse.json(
      { error: 'Failed to get refund requests' },
      { status: 500 }
    );
  }
}

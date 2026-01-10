import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { refundRequests, orders, customers, REFUND_REQUEST_STATUS } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';

// Admin auth check - verify session cookie exists and has a value
function isAdminAuthenticated(request: NextRequest): boolean {
  const adminSession = request.cookies.get('admin_session')?.value;
  return adminSession !== undefined && adminSession.length > 0;
}

// GET - List all refund requests
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    const query = db.select({
      id: refundRequests.id,
      orderId: refundRequests.orderId,
      orderNumber: orders.orderNumber,
      customerId: refundRequests.customerId,
      customerEmail: customers.email,
      customerName: customers.firstName,
      reason: refundRequests.reason,
      reasonDetails: refundRequests.reasonDetails,
      requestedAmount: refundRequests.requestedAmount,
      approvedAmount: refundRequests.approvedAmount,
      status: refundRequests.status,
      adminNotes: refundRequests.adminNotes,
      stripeRefundId: refundRequests.stripeRefundId,
      createdAt: refundRequests.createdAt,
      reviewedAt: refundRequests.reviewedAt,
      processedAt: refundRequests.processedAt,
      orderTotal: orders.total,
      orderCurrency: orders.currency,
    })
    .from(refundRequests)
    .leftJoin(orders, eq(orders.id, refundRequests.orderId))
    .leftJoin(customers, eq(customers.id, refundRequests.customerId))
    .orderBy(desc(refundRequests.createdAt));

    // Filter by status if provided
    const results = status
      ? await query.where(eq(refundRequests.status, status))
      : await query;

    return NextResponse.json({ refundRequests: results });
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refund requests' },
      { status: 500 }
    );
  }
}

// POST - Process a refund request (approve/deny)
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { refundRequestId, action, adminNotes, approvedAmount } = body;

    if (!refundRequestId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get the refund request
    const refundRequest = await db.query.refundRequests.findFirst({
      where: eq(refundRequests.id, refundRequestId),
    });

    if (!refundRequest) {
      return NextResponse.json(
        { error: 'Refund request not found' },
        { status: 404 }
      );
    }

    if (refundRequest.status !== REFUND_REQUEST_STATUS.PENDING) {
      return NextResponse.json(
        { error: 'Refund request has already been processed' },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === 'deny') {
      // Deny the request
      await db.update(refundRequests)
        .set({
          status: REFUND_REQUEST_STATUS.DENIED,
          adminNotes: adminNotes || null,
          reviewedAt: now,
        })
        .where(eq(refundRequests.id, refundRequestId));

      return NextResponse.json({
        success: true,
        message: 'Refund request denied',
      });
    }

    // Approve the request
    const refundAmount = approvedAmount || refundRequest.requestedAmount;

    // Get the order to get the payment intent
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, refundRequest.orderId),
    });

    if (!order || !order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'Order or payment intent not found' },
        { status: 400 }
      );
    }

    // Update request status to approved first
    await db.update(refundRequests)
      .set({
        status: REFUND_REQUEST_STATUS.APPROVED,
        approvedAmount: refundAmount,
        adminNotes: adminNotes || null,
        reviewedAt: now,
      })
      .where(eq(refundRequests.id, refundRequestId));

    // Process refund through Stripe
    try {
      const refund = await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
          refundRequestId,
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      });

      // Update request as processed with Stripe refund ID
      await db.update(refundRequests)
        .set({
          status: REFUND_REQUEST_STATUS.PROCESSED,
          stripeRefundId: refund.id,
          processedAt: now,
        })
        .where(eq(refundRequests.id, refundRequestId));

      // Note: The order status will be updated by the charge.refunded webhook
      // But let's also update it here for immediate feedback
      await db.update(orders)
        .set({
          status: 'refunded',
          paymentStatus: 'refunded',
          updatedAt: now,
        })
        .where(eq(orders.id, order.id));

      return NextResponse.json({
        success: true,
        message: 'Refund processed successfully',
        stripeRefundId: refund.id,
      });
    } catch (stripeError: unknown) {
      console.error('Stripe refund error:', stripeError);
      
      // Revert status back to approved (not processed)
      await db.update(refundRequests)
        .set({
          status: REFUND_REQUEST_STATUS.APPROVED,
          adminNotes: `${adminNotes || ''}\n\nStripe refund failed: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`.trim(),
        })
        .where(eq(refundRequests.id, refundRequestId));

      return NextResponse.json(
        { error: 'Failed to process refund through Stripe' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing refund request:', error);
    return NextResponse.json(
      { error: 'Failed to process refund request' },
      { status: 500 }
    );
  }
}

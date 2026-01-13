import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviewRequests, orders, orderItems, customers, REVIEW_REWARD_AMOUNT } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/reviews/validate-token - Validate a review request token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token required' }, { status: 400 });
    }

    // Find the review request
    const reviewRequest = await db.query.reviewRequests.findFirst({
      where: eq(reviewRequests.token, token),
    });

    if (!reviewRequest) {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 404 });
    }

    // Check if expired
    if (reviewRequest.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: 'Token expired' }, { status: 400 });
    }

    // Check if already reviewed
    if (reviewRequest.reviewedAt) {
      return NextResponse.json({ 
        valid: true, 
        alreadyReviewed: true,
        orderId: reviewRequest.orderId,
        productId: reviewRequest.productId,
      });
    }

    // Get order details
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, reviewRequest.orderId),
    });

    // Get order item (product) details
    const orderItem = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, reviewRequest.orderItemId),
    });

    // Get customer details
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, reviewRequest.customerId),
    });

    if (!order || !orderItem || !customer) {
      return NextResponse.json({ valid: false, error: 'Order data not found' }, { status: 404 });
    }

    // Get product image from products API or database
    let productImage = null;
    try {
      const { getProductById } = await import('@/lib/products');
      const product = await getProductById(reviewRequest.productId);
      productImage = product?.image || null;
    } catch {
      // Ignore - image is optional
    }

    return NextResponse.json({
      valid: true,
      alreadyReviewed: false,
      orderId: reviewRequest.orderId,
      orderNumber: order.orderNumber,
      productId: reviewRequest.productId,
      productName: orderItem.productName,
      productImage,
      variantName: orderItem.variantName,
      customerName: customer.firstName || customer.email.split('@')[0],
      rewardAmount: REVIEW_REWARD_AMOUNT,
    });
  } catch (error) {
    console.error('Error validating review token:', error);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}

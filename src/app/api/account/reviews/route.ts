import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reviewRequests, orders, orderItems, REVIEW_REWARD_AMOUNT } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentCustomer } from '@/lib/auth';

// GET /api/account/reviews - Get customer's review requests
export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all review requests for this customer
    const requests = await db.query.reviewRequests.findMany({
      where: eq(reviewRequests.customerId, customer.id),
      orderBy: [desc(reviewRequests.createdAt)],
    });

    // Enrich with order and product info
    const enrichedRequests = await Promise.all(requests.map(async (request) => {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, request.orderId),
      });
      
      const orderItem = await db.query.orderItems.findFirst({
        where: eq(orderItems.id, request.orderItemId),
      });

      // Get product image from products
      let productImage = null;
      try {
        const { getProductById } = await import('@/lib/products');
        const product = await getProductById(request.productId);
        productImage = product?.image || null;
      } catch {
        // Ignore - image is optional
      }

      return {
        id: request.id,
        productId: request.productId,
        productName: orderItem?.productName || 'Unknown Product',
        productImage,
        orderNumber: order?.orderNumber || 'Unknown',
        token: request.token,
        status: request.reviewedAt ? 'reviewed' : 'pending',
        rewardCode: request.rewardCode,
        rewardAmount: REVIEW_REWARD_AMOUNT,
        createdAt: request.createdAt.toISOString(),
        expiresAt: request.expiresAt.toISOString(),
        reviewedAt: request.reviewedAt?.toISOString() || null,
      };
    }));

    // Filter out expired pending requests
    const now = new Date();
    const validRequests = enrichedRequests.filter(r => 
      r.status === 'reviewed' || new Date(r.expiresAt) > now
    );

    return NextResponse.json({
      reviewRequests: validRequests,
    });
  } catch (error) {
    console.error('Error fetching review requests:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews, orders, orderItems, REVIEW_STATUS } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentCustomer } from '@/lib/auth';

// GET - Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productSlug = searchParams.get('productSlug');
    
    if (!productSlug) {
      return NextResponse.json({ error: 'Product slug required' }, { status: 400 });
    }
    
    // Only fetch approved reviews for public display
    const productReviews = await db.query.reviews.findMany({
      where: and(
        eq(reviews.productSlug, productSlug),
        eq(reviews.status, REVIEW_STATUS.APPROVED)
      ),
      orderBy: [desc(reviews.createdAt)],
    });
    
    // Calculate average rating
    const avgRating = productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
      : 0;
    
    // Calculate rating distribution
    const ratingDistribution = {
      5: productReviews.filter(r => r.rating === 5).length,
      4: productReviews.filter(r => r.rating === 4).length,
      3: productReviews.filter(r => r.rating === 3).length,
      2: productReviews.filter(r => r.rating === 2).length,
      1: productReviews.filter(r => r.rating === 1).length,
    };
    
    return NextResponse.json({
      reviews: productReviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        customerName: r.customerName,
        verifiedPurchase: r.verifiedPurchase,
        createdAt: r.createdAt,
        adminResponse: r.adminResponse,
        adminRespondedAt: r.adminRespondedAt,
      })),
      totalReviews: productReviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
      ratingDistribution,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST - Submit a review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productSlug, orderId, rating, title, content, customerName } = body;
    
    // Validate required fields
    if (!productSlug || !rating || !customerName) {
      return NextResponse.json(
        { error: 'Product slug, rating, and customer name are required' },
        { status: 400 }
      );
    }
    
    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }
    
    // Check if user is logged in
    const customer = await getCurrentCustomer();
    
    // Verify purchase if orderId provided
    let verifiedPurchase = false;
    let verifiedOrderId: string | null = null;
    
    if (orderId && customer) {
      // Check if this customer actually ordered this product
      const order = await db.query.orders.findFirst({
        where: and(
          eq(orders.id, orderId),
          eq(orders.customerId, customer.id)
        ),
      });
      
      if (order) {
        // Check if the order contains this product
        const orderItem = await db.query.orderItems.findFirst({
          where: and(
            eq(orderItems.orderId, orderId),
            eq(orderItems.productSlug, productSlug)
          ),
        });
        
        if (orderItem) {
          verifiedPurchase = true;
          verifiedOrderId = orderId;
        }
      }
    }
    
    // Check for duplicate review (same customer/email for same product)
    if (customer) {
      const existingReview = await db.query.reviews.findFirst({
        where: and(
          eq(reviews.productSlug, productSlug),
          eq(reviews.customerId, customer.id)
        ),
      });
      
      if (existingReview) {
        return NextResponse.json(
          { error: 'You have already reviewed this product' },
          { status: 400 }
        );
      }
    }
    
    const now = new Date();
    const reviewId = crypto.randomUUID();
    
    await db.insert(reviews).values({
      id: reviewId,
      productSlug,
      orderId: verifiedOrderId,
      customerId: customer?.id || null,
      rating,
      title: title?.trim() || null,
      content: content?.trim() || null,
      customerName: customerName.trim(),
      verifiedPurchase,
      status: REVIEW_STATUS.PENDING,
      createdAt: now,
    });
    
    console.log(`New review submitted for ${productSlug} by ${customerName} (verified: ${verifiedPurchase})`);
    
    return NextResponse.json({
      success: true,
      reviewId,
      message: 'Thank you for your review! It will be published after moderation.',
    });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

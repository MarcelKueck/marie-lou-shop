import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const SESSION_COOKIE_NAME = 'marie_lou_session';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
        eq(orders.id, id),
        eq(orders.customerId, customer.id)
      ),
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get order items
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, order.id),
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        // Pricing
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        currency: order.currency,
        // Shipping
        shippingMethod: order.shippingMethod,
        shippingAddress: {
          firstName: order.shippingFirstName,
          lastName: order.shippingLastName,
          company: order.shippingCompany,
          line1: order.shippingLine1,
          line2: order.shippingLine2,
          city: order.shippingCity,
          state: order.shippingState,
          postalCode: order.shippingPostalCode,
          country: order.shippingCountry,
        },
        // Tracking
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        // Timestamps
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        roastedAt: order.roastedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        // Customer notes
        customerNotes: order.customerNotes,
      },
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        variantId: item.variantId,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        weight: item.weight,
      })),
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Failed to get order' },
      { status: 500 }
    );
  }
}

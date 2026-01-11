import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendShippingNotificationEmail, sendDeliveryConfirmationEmail } from '@/lib/email';

// Valid order statuses
const VALID_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

// PATCH - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { status, trackingNumber, trackingUrl } = body;
    
    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Get the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const now = new Date();
    const updates: Partial<typeof orders.$inferInsert> = {
      status,
      updatedAt: now,
    };
    
    // Status-specific updates
    switch (status) {
      case 'processing':
        updates.roastedAt = now;
        break;
        
      case 'shipped':
        updates.shippedAt = now;
        if (trackingNumber) {
          updates.trackingNumber = trackingNumber;
        }
        if (trackingUrl) {
          updates.trackingUrl = trackingUrl;
        }
        break;
        
      case 'delivered':
        updates.deliveredAt = now;
        break;
    }
    
    // Update the order
    await db.update(orders)
      .set(updates)
      .where(eq(orders.id, orderId));
    
    console.log(`Order ${order.orderNumber} status updated to ${status}`);
    
    // Send emails for certain status changes
    try {
      // Fetch order items for email
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId),
      });
      
      // Get updated order
      const updatedOrder = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });
      
      if (updatedOrder && items.length > 0) {
        if (status === 'shipped' && trackingNumber) {
          await sendShippingNotificationEmail({
            order: updatedOrder,
            items,
            trackingNumber,
            trackingUrl,
            locale: 'de',
          });
          console.log(`Shipping notification email sent for order ${order.orderNumber}`);
        }
        
        if (status === 'delivered') {
          await sendDeliveryConfirmationEmail({
            order: updatedOrder,
            items,
            locale: 'de',
          });
          console.log(`Delivery confirmation email sent for order ${order.orderNumber}`);
        }
      }
    } catch (emailError) {
      // Log but don't fail the status update
      console.error(`Failed to send email for order ${order.orderNumber}:`, emailError);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}

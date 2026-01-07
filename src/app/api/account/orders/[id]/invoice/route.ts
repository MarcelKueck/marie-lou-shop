import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { downloadInvoicePdf } from '@/lib/invoice';

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

    // Verify order belongs to customer
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

    // Only generate invoice for paid orders
    if (order.paymentStatus !== 'paid') {
      return NextResponse.json(
        { error: 'Invoice not available for unpaid orders' },
        { status: 400 }
      );
    }

    // Download/generate invoice PDF
    const { pdf, filename } = await downloadInvoicePdf(id);

    // Return PDF
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Invoice download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { desc, gte, lte, and } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  // Verify admin is authenticated
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');

    // Build where conditions
    const conditions = [];
    
    if (from) {
      conditions.push(gte(orders.createdAt, new Date(from)));
    }
    
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, toDate));
    }

    // Fetch orders with items
    const allOrders = await db.query.orders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        items: true,
      },
      orderBy: [desc(orders.createdAt)],
    });

    // Filter by status if provided
    const filteredOrders = status 
      ? allOrders.filter(o => o.status === status)
      : allOrders;

    // Generate CSV headers
    const headers = [
      'Bestellnummer',
      'Datum',
      'Status',
      'Vorname',
      'Nachname',
      'E-Mail',
      'Telefon',
      'Lieferadresse',
      'Stadt',
      'PLZ',
      'Land',
      'Marke',
      'Zwischensumme',
      'Versand',
      'Rabatt',
      'Gesamt',
      'Zahlungs-ID',
      'Tracking-Nummer',
      'Artikel',
    ];

    // Generate CSV rows
    const rows = filteredOrders.map(order => {
      // Format items as string
      const itemsStr = (order.items || [])
        .map((item: { quantity: number; productName: string; variantName: string }) => 
          `${item.quantity}x ${item.productName} (${item.variantName})`
        )
        .join('; ');

      // Escape CSV fields
      const escapeField = (field: string | number | null | undefined) => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeField(order.orderNumber),
        escapeField(order.createdAt ? new Date(order.createdAt).toLocaleDateString('de-DE') : ''),
        escapeField(order.status),
        escapeField(order.firstName),
        escapeField(order.lastName),
        escapeField(order.email),
        escapeField(order.phone),
        escapeField(order.shippingLine1),
        escapeField(order.shippingCity),
        escapeField(order.shippingPostalCode),
        escapeField(order.shippingCountry),
        escapeField(order.brand),
        escapeField((order.subtotal / 100).toFixed(2)),
        escapeField((order.shippingCost / 100).toFixed(2)),
        escapeField(((order.discount || 0) / 100).toFixed(2)),
        escapeField((order.total / 100).toFixed(2)),
        escapeField(order.stripePaymentIntentId),
        escapeField(order.trackingNumber),
        escapeField(itemsStr),
      ].join(',');
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Generate filename with date range
    const dateStr = new Date().toISOString().split('T')[0];
    let filename = `bestellungen-${dateStr}`;
    if (from) filename += `-von-${from}`;
    if (to) filename += `-bis-${to}`;
    filename += '.csv';

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

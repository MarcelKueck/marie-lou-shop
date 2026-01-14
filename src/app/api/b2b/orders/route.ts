import { NextRequest, NextResponse } from 'next/server';
import { requireB2BAuth } from '@/lib/b2b-auth';
import { db } from '@/db';
import { orders, orderItems, products, productVariants, b2bOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verify B2B authentication
    const company = await requireB2BAuth();
    
    if (!company) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { items, poNumber } = body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }
    
    // Fetch all products and variants
    const allProducts = await db.select().from(products);
    const allVariants = await db.select().from(productVariants);
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    const variantMap = new Map(allVariants.map(v => [v.id, v]));
    
    // Calculate totals
    let subtotal = 0;
    let totalWeight = 0;
    const orderItemsData: Array<{
      productId: string;
      variantId: string;
      productName: string;
      variantName: string;
      productSlug: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      weight: string;
    }> = [];
    
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      
      // Get the variant (default to first variant if not specified)
      let variant = item.variantId ? variantMap.get(item.variantId) : null;
      if (!variant) {
        // Find first variant for this product
        variant = allVariants.find(v => v.productId === product.id);
      }
      
      const unitPrice = product.basePrice + (variant?.priceModifier || 0);
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;
      
      // Parse weight from variant (e.g., "250g" -> 250)
      const weightStr = variant?.weight || '250g';
      const weightNum = parseInt(weightStr) || 250;
      totalWeight += weightNum * item.quantity;
      
      orderItemsData.push({
        productId: product.id,
        variantId: variant?.id || product.id,
        productName: product.nameEn,
        variantName: variant?.nameEn || weightStr,
        productSlug: product.slug,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        weight: weightStr,
      });
    }
    
    // Calculate volume discount (Flex tier)
    const totalWeightKg = totalWeight / 1000;
    let discountPercent = 0;
    if (totalWeightKg >= 50) discountPercent = 20;
    else if (totalWeightKg >= 25) discountPercent = 15;
    else if (totalWeightKg >= 10) discountPercent = 10;
    else if (totalWeightKg >= 5) discountPercent = 5;
    
    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    const total = subtotal - discountAmount;
    
    // Generate order number
    const orderNumber = `B2B-${Date.now().toString(36).toUpperCase()}`;
    const orderId = randomUUID();
    const now = new Date();
    
    // Create the main order
    await db.insert(orders).values({
      id: orderId,
      orderNumber,
      brand: company.preferredBrand || 'coffee',
      email: company.contactEmail,
      firstName: company.contactFirstName,
      lastName: company.contactLastName,
      phone: company.contactPhone,
      status: 'pending',
      shippingFirstName: company.contactFirstName,
      shippingLastName: company.contactLastName,
      shippingCompany: company.companyName,
      shippingLine1: company.shippingLine1 || '',
      shippingLine2: company.shippingLine2,
      shippingCity: company.shippingCity || '',
      shippingPostalCode: company.shippingPostalCode || '',
      shippingCountry: company.shippingCountry || 'DE',
      billingFirstName: company.contactFirstName,
      billingLastName: company.contactLastName,
      billingCompany: company.companyName,
      billingLine1: company.billingLine1,
      billingLine2: company.billingLine2,
      billingCity: company.billingCity,
      billingPostalCode: company.billingPostalCode,
      billingCountry: company.billingCountry || 'DE',
      shippingMethod: 'standard',
      subtotal,
      shippingCost: 0, // Free shipping for B2B
      discount: discountAmount,
      total,
      paymentStatus: 'pending',
      createdAt: now,
      updatedAt: now,
      // B2B specific fields
      b2bPromoCode: company.promoCode,
      b2bPromoDiscount: discountAmount,
    });
    
    // Create order items
    for (const item of orderItemsData) {
      await db.insert(orderItems).values({
        id: randomUUID(),
        orderId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        productSlug: item.productSlug,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        weight: item.weight,
        createdAt: now,
      });
    }
    
    // Create B2B order link
    await db.insert(b2bOrders).values({
      id: randomUUID(),
      companyId: company.id,
      orderId,
      orderType: company.tier === 'smart' ? 'smart_ondemand' : 'flex',
      poNumber: poNumber || null,
      paymentStatus: 'pending',
      volumeDiscountPercent: discountPercent,
      volumeDiscountAmount: discountAmount,
      createdAt: now,
    });
    
    // TODO: Send confirmation email
    // TODO: Create invoice via rechnungs-api.de
    
    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        subtotal,
        discountPercent,
        discountAmount,
        total,
        itemCount: orderItemsData.length,
      },
    });
    
  } catch (error) {
    console.error('Error creating B2B order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Verify B2B authentication
    const company = await requireB2BAuth();
    
    if (!company) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch B2B orders with linked order details
    const companyOrders = await db
      .select({
        b2bOrder: b2bOrders,
        order: orders,
      })
      .from(b2bOrders)
      .leftJoin(orders, eq(b2bOrders.orderId, orders.id))
      .where(eq(b2bOrders.companyId, company.id));
    
    const formattedOrders = companyOrders.map(({ b2bOrder, order }) => ({
      id: b2bOrder.id,
      orderId: b2bOrder.orderId,
      orderNumber: order?.orderNumber || b2bOrder.id.slice(0, 8),
      orderType: b2bOrder.orderType,
      poNumber: b2bOrder.poNumber,
      status: order?.status || 'pending',
      paymentStatus: b2bOrder.paymentStatus,
      subtotal: order?.subtotal || 0,
      discount: b2bOrder.volumeDiscountAmount || 0,
      total: order?.total || 0,
      createdAt: b2bOrder.createdAt,
    }));
    
    return NextResponse.json({ orders: formattedOrders });
    
  } catch (error) {
    console.error('Error fetching B2B orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

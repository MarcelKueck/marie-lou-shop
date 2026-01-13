/**
 * Test script to manually create a review request for testing
 * Usage: npx tsx scripts/create-test-review-request.ts
 */

import { db } from '../src/db';
import { orders, orderItems, reviewRequests, customers } from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

async function createTestReviewRequest() {
  console.log('🔍 Finding a recent delivered order...\n');

  // Find the most recent order (any status for testing)
  const recentOrder = await db.query.orders.findFirst({
    orderBy: [desc(orders.createdAt)],
  });

  if (!recentOrder) {
    console.log('❌ No orders found. Please place an order first.');
    process.exit(1);
  }

  console.log(`📦 Found order: #${recentOrder.orderNumber}`);
  console.log(`   Status: ${recentOrder.status}`);
  console.log(`   Email: ${recentOrder.email}`);
  console.log(`   Customer ID: ${recentOrder.customerId || 'Guest'}`);

  // Get order items
  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, recentOrder.id),
  });

  if (items.length === 0) {
    console.log('❌ No items found for this order.');
    process.exit(1);
  }

  console.log(`\n📝 Creating review requests for ${items.length} item(s)...\n`);

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiry

  // If no customer ID, try to find or create customer by email
  let customerId = recentOrder.customerId;
  if (!customerId) {
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.email, recentOrder.email),
    });
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log(`   Found customer by email: ${customerId}`);
    } else {
      // Create a customer record for testing
      customerId = crypto.randomUUID();
      await db.insert(customers).values({
        id: customerId,
        email: recentOrder.email,
        firstName: recentOrder.firstName,
        lastName: recentOrder.lastName,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`   Created test customer: ${customerId}`);
    }
  }

  const createdTokens: string[] = [];

  for (const item of items) {
    // Check if review request already exists
    const existing = await db.query.reviewRequests.findFirst({
      where: eq(reviewRequests.orderItemId, item.id),
    });

    if (existing) {
      console.log(`   ⚠️  Review request already exists for ${item.productName}`);
      console.log(`      Token: ${existing.token}`);
      createdTokens.push(existing.token);
      continue;
    }

    const token = crypto.randomBytes(32).toString('hex');

    await db.insert(reviewRequests).values({
      id: crypto.randomUUID(),
      orderId: recentOrder.id,
      orderItemId: item.id,
      customerId: customerId!,
      productId: item.productId,
      token,
      createdAt: now,
      expiresAt,
    });

    createdTokens.push(token);
    console.log(`   ✅ Created review request for: ${item.productName}`);
    console.log(`      Token: ${token}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 Test review requests created!\n');
  console.log('To test, visit these URLs:\n');
  
  for (const token of createdTokens) {
    console.log(`   http://localhost:3000/de/review/${token}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nOr check the Reviews tab in your account page:');
  console.log('   http://localhost:3000/de/account?tab=reviews\n');

  process.exit(0);
}

createTestReviewRequest().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

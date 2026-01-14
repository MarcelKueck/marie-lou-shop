/**
 * Email System Test Script
 * 
 * Tests all email templates by sending them to a test email address.
 * 
 * Usage: 
 *   TEST_EMAIL=your@email.com npx tsx scripts/test-emails.ts
 * 
 * Note: Resend has a rate limit of 2 requests/second on the free tier,
 * so we add delays between sends.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// Dynamic imports to ensure env is loaded first
const runTests = async () => {
  const { 
    sendOrderConfirmationEmail,
    sendShippingNotificationEmail,
    sendDeliveryConfirmationEmail,
    sendReviewRequestEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendSubscriptionReminderEmail,
    sendGiftCardEmail,
  } = await import('../src/lib/email');

  const testEmail = process.env.TEST_EMAIL;
  
  if (!testEmail) {
    console.error('❌ Please provide TEST_EMAIL environment variable');
    console.error('   Usage: TEST_EMAIL=your@email.com npx tsx scripts/test-emails.ts');
    process.exit(1);
  }

  console.log('🧪 Email System Test');
  console.log('====================');
  console.log(`📧 Test email: ${testEmail}`);
  console.log(`🔑 Resend API Key: ${process.env.RESEND_API_KEY ? 'Present' : 'MISSING!'}`);
  console.log('');

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Mock data for testing
  const mockOrder = {
    id: 1,
    orderNumber: 'TEST-ORD-001',
    email: testEmail,
    firstName: 'Test',
    lastName: 'User',
    brand: 'coffee' as const,
    status: 'pending' as const,
    subtotal: '29.99',
    shippingCost: '4.99',
    total: '34.98',
    currency: 'EUR',
    shippingAddress: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      street: '123 Test Street',
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE'
    }),
    billingAddress: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      street: '123 Test Street',
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE'
    }),
    trackingNumber: 'TRACK123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
    stripePaymentIntentId: 'pi_test_123',
    stripeSessionId: 'cs_test_123',
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    notes: null,
    userId: null,
    couponId: null,
    referralCodeUsed: null,
    giftCardCode: null,
    giftCardAmount: null,
    invoicePath: null,
    discountAmount: null,
    taxAmount: null,
    paymentMethod: null,
    paymentStatus: null,
    shippingMethod: null,
    estimatedDelivery: null,
    metadata: null,
  };

  const mockOrderItems = [
    {
      id: 1,
      orderId: 1,
      productId: 'ethiopian-yirgacheffe',
      variantId: 'ethiopian-yirgacheffe-250g-whole',
      productName: 'Ethiopian Yirgacheffe',
      variantName: '250g Whole Bean',
      quantity: 2,
      unitPrice: '14.99',
      totalPrice: '29.98',
      createdAt: new Date(),
    }
  ];

  const results: { name: string; success: boolean; error?: string }[] = [];

  const testEmail_ = async (name: string, fn: () => Promise<unknown>) => {
    process.stdout.write(`${results.length + 1}. ${name}... `);
    try {
      const result = await fn() as { error?: { message?: string } };
      if (result?.error) {
        console.log(`❌ (${result.error.message || JSON.stringify(result.error)})`);
        results.push({ name, success: false, error: result.error.message || JSON.stringify(result.error) });
      } else {
        console.log('✅');
        results.push({ name, success: true });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`❌ (${errorMsg})`);
      results.push({ name, success: false, error: errorMsg });
    }
    // Add delay to avoid rate limiting
    await delay(600);
  };

  // 1. Order Confirmation Email
  await testEmail_('Order Confirmation', () =>
    sendOrderConfirmationEmail({
      order: mockOrder as never,
      items: mockOrderItems as never,
      locale: 'en'
    })
  );

  // 2. Shipping Notification Email
  await testEmail_('Shipping Notification', () =>
    sendShippingNotificationEmail({
      order: mockOrder as never,
      items: mockOrderItems as never,
      trackingNumber: 'TRACK123456789',
      trackingUrl: 'https://tracking.example.com/TRACK123456789',
      locale: 'en'
    })
  );

  // 3. Delivery Confirmation Email
  await testEmail_('Delivery Confirmation', () =>
    sendDeliveryConfirmationEmail({
      order: { ...mockOrder, deliveredAt: new Date().toISOString() } as never,
      items: mockOrderItems as never,
      locale: 'en'
    })
  );

  // 4. Review Request Email
  await testEmail_('Review Request', () =>
    sendReviewRequestEmail(
      mockOrder as never,
      'en',
      [{ productId: 'ethiopian-yirgacheffe', productName: 'Ethiopian Yirgacheffe', token: 'test-token-123' }],
      5
    )
  );

  // 5. Password Reset Email
  await testEmail_('Password Reset', () =>
    sendPasswordResetEmail(testEmail, 'test-reset-token-123', 'en', 'coffee')
  );

  // 6. Welcome Email
  await testEmail_('Welcome Email', () =>
    sendWelcomeEmail(testEmail, 'Test', 'TEST-REF-CODE', 'en', 'coffee')
  );

  // 7. Subscription Reminder Email
  await testEmail_('Subscription Reminder', () =>
    sendSubscriptionReminderEmail({
      email: testEmail,
      firstName: 'Test',
      subscriptionId: 'sub_test_123',
      nextDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      items: [{ productName: 'Ethiopian Yirgacheffe', variantName: '250g Whole Bean', quantity: 1, unitPrice: 14.99 }],
      total: 19.99,
      brand: 'coffee',
      locale: 'en'
    })
  );

  // 8. Gift Card Email
  await testEmail_('Gift Card Email', () =>
    sendGiftCardEmail({
      recipientEmail: testEmail,
      recipientName: 'Test Recipient',
      senderEmail: 'sender@test.com',
      code: 'GIFTTEST123',
      amount: 50,
      personalMessage: 'Enjoy your coffee!',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      locale: 'en',
      brand: 'coffee'
    })
  );

  // Summary
  console.log('');
  console.log('Summary');
  console.log('=======');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('');
    console.log('Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('');
  if (passed === results.length) {
    console.log('🎉 All email templates working!');
    console.log('📬 Check your inbox at:', testEmail);
  } else {
    console.log('⚠️  Some emails failed. Check the errors above.');
  }
};

runTests().catch(console.error);

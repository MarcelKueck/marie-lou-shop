import { db } from '@/db';
import { giftCards, giftCardTransactions } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Generate a gift card code like GIFT-XXXX-XXXX
export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters
  let code = 'GIFT-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Available gift card amounts (in cents)
export const GIFT_CARD_AMOUNTS = [
  { value: 2500, label: '25€' },
  { value: 5000, label: '50€' },
  { value: 7500, label: '75€' },
  { value: 10000, label: '100€' },
  { value: 15000, label: '150€' },
];

// Create a new gift card
export async function createGiftCard(data: {
  amount: number;
  purchasedByEmail: string;
  purchasedByCustomerId?: string;
  orderId?: string;
  recipientEmail?: string;
  recipientName?: string;
  personalMessage?: string;
  deliveryMethod?: 'email' | 'download';
}) {
  const id = nanoid();
  let code = generateGiftCardCode();
  
  // Ensure code is unique
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.select().from(giftCards).where(eq(giftCards.code, code)).limit(1);
    if (existing.length === 0) break;
    code = generateGiftCardCode();
    attempts++;
  }
  
  const now = new Date();
  // Gift cards valid for 3 years from purchase
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 3);
  
  const giftCard = await db.insert(giftCards).values({
    id,
    code,
    initialAmount: data.amount,
    currentBalance: data.amount,
    currency: 'EUR',
    purchasedByEmail: data.purchasedByEmail,
    purchasedByCustomerId: data.purchasedByCustomerId || null,
    orderId: data.orderId || null,
    recipientEmail: data.recipientEmail || null,
    recipientName: data.recipientName || null,
    personalMessage: data.personalMessage || null,
    deliveryMethod: data.deliveryMethod || 'email',
    status: 'pending', // Will be activated after payment
    expiresAt,
    createdAt: now,
    updatedAt: now,
  }).returning();
  
  return giftCard[0];
}

// Activate a gift card after payment
export async function activateGiftCard(giftCardId: string) {
  const now = new Date();
  
  await db.update(giftCards)
    .set({
      status: 'active',
      updatedAt: now,
    })
    .where(eq(giftCards.id, giftCardId));
}

// Validate and get a gift card by code
export async function validateGiftCard(code: string) {
  const normalizedCode = code.toUpperCase().trim();
  
  const result = await db.select()
    .from(giftCards)
    .where(eq(giftCards.code, normalizedCode))
    .limit(1);
  
  if (result.length === 0) {
    return { valid: false, error: 'Gift card not found' };
  }
  
  const giftCard = result[0];
  
  if (giftCard.status !== 'active') {
    if (giftCard.status === 'pending') {
      return { valid: false, error: 'Gift card payment not confirmed yet' };
    }
    if (giftCard.status === 'used') {
      return { valid: false, error: 'Gift card has been fully used' };
    }
    if (giftCard.status === 'expired') {
      return { valid: false, error: 'Gift card has expired' };
    }
    if (giftCard.status === 'disabled') {
      return { valid: false, error: 'Gift card has been disabled' };
    }
    return { valid: false, error: 'Gift card is not active' };
  }
  
  // Check expiry
  if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
    // Mark as expired
    await db.update(giftCards)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(giftCards.id, giftCard.id));
    
    return { valid: false, error: 'Gift card has expired' };
  }
  
  if (giftCard.currentBalance <= 0) {
    return { valid: false, error: 'Gift card has no remaining balance' };
  }
  
  return {
    valid: true,
    giftCard: {
      id: giftCard.id,
      code: giftCard.code,
      balance: giftCard.currentBalance,
      currency: giftCard.currency,
    },
  };
}

// Redeem a gift card
export async function redeemGiftCard(
  giftCardId: string,
  amount: number,
  orderId: string
) {
  const giftCard = await db.select()
    .from(giftCards)
    .where(eq(giftCards.id, giftCardId))
    .limit(1);
  
  if (giftCard.length === 0) {
    throw new Error('Gift card not found');
  }
  
  const card = giftCard[0];
  
  if (card.status !== 'active') {
    throw new Error('Gift card is not active');
  }
  
  if (card.currentBalance < amount) {
    throw new Error('Insufficient gift card balance');
  }
  
  const newBalance = card.currentBalance - amount;
  const now = new Date();
  
  // Update gift card balance
  await db.update(giftCards)
    .set({
      currentBalance: newBalance,
      status: newBalance === 0 ? 'used' : 'active',
      updatedAt: now,
    })
    .where(eq(giftCards.id, giftCardId));
  
  // Record the transaction
  await db.insert(giftCardTransactions).values({
    id: nanoid(),
    giftCardId,
    orderId,
    amount,
    balanceBefore: card.currentBalance,
    balanceAfter: newBalance,
    type: 'redemption',
    createdAt: now,
  });
  
  return {
    amountUsed: amount,
    newBalance,
  };
}

// Refund to a gift card
export async function refundToGiftCard(
  giftCardId: string,
  amount: number,
  orderId?: string
) {
  const giftCard = await db.select()
    .from(giftCards)
    .where(eq(giftCards.id, giftCardId))
    .limit(1);
  
  if (giftCard.length === 0) {
    throw new Error('Gift card not found');
  }
  
  const card = giftCard[0];
  const now = new Date();
  
  // Don't allow refund to exceed original amount
  const maxBalance = card.initialAmount;
  const actualRefund = Math.min(amount, maxBalance - card.currentBalance);
  const actualNewBalance = card.currentBalance + actualRefund;
  
  // Update gift card balance
  await db.update(giftCards)
    .set({
      currentBalance: actualNewBalance,
      status: 'active',
      updatedAt: now,
    })
    .where(eq(giftCards.id, giftCardId));
  
  // Record the transaction
  await db.insert(giftCardTransactions).values({
    id: nanoid(),
    giftCardId,
    orderId: orderId || null,
    amount: actualRefund,
    balanceBefore: card.currentBalance,
    balanceAfter: actualNewBalance,
    type: 'refund',
    createdAt: now,
  });
  
  return {
    amountRefunded: actualRefund,
    newBalance: actualNewBalance,
  };
}

// Get gift card history for a customer
export async function getCustomerGiftCards(customerEmail: string) {
  const purchased = await db.select()
    .from(giftCards)
    .where(eq(giftCards.purchasedByEmail, customerEmail));
  
  const received = await db.select()
    .from(giftCards)
    .where(
      and(
        eq(giftCards.recipientEmail, customerEmail),
        or(
          eq(giftCards.status, 'active'),
          eq(giftCards.status, 'used')
        )
      )
    );
  
  return { purchased, received };
}

// Get gift card transactions
export async function getGiftCardTransactions(giftCardId: string) {
  return db.select()
    .from(giftCardTransactions)
    .where(eq(giftCardTransactions.giftCardId, giftCardId));
}

// Send gift card email
export async function sendGiftCardEmail(giftCardId: string) {
  const giftCard = await db.select()
    .from(giftCards)
    .where(eq(giftCards.id, giftCardId))
    .limit(1);
  
  if (giftCard.length === 0 || !giftCard[0].recipientEmail) {
    return false;
  }
  
  const card = giftCard[0];
  const recipientEmail = card.recipientEmail as string; // We've already checked it's not null
  
  // Import email function dynamically to avoid circular dependencies
  const { sendGiftCardEmail: sendEmail } = await import('./email');
  
  const result = await sendEmail({
    recipientEmail,
    recipientName: card.recipientName || undefined,
    senderEmail: card.purchasedByEmail,
    code: card.code,
    amount: card.initialAmount,
    personalMessage: card.personalMessage || undefined,
    expiresAt: card.expiresAt || undefined,
  });
  
  if (!result.success) {
    console.error(`Failed to send gift card email for ${giftCardId}:`, result.error);
    // Don't throw - gift card is already activated, just log the email failure
    return false;
  }
  
  // Mark as sent
  await db.update(giftCards)
    .set({
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));
  
  return true;
}

// Admin: Get all gift cards
export async function getAllGiftCards() {
  return db.select().from(giftCards);
}

// Admin: Disable a gift card
export async function disableGiftCard(giftCardId: string) {
  await db.update(giftCards)
    .set({
      status: 'disabled',
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));
}

// Admin: Enable a disabled gift card
export async function enableGiftCard(giftCardId: string) {
  const card = await db.select().from(giftCards).where(eq(giftCards.id, giftCardId)).limit(1);
  
  if (card.length === 0) {
    throw new Error('Gift card not found');
  }
  
  // Can only enable disabled cards
  if (card[0].status !== 'disabled') {
    throw new Error('Gift card is not disabled');
  }
  
  // If balance is 0, set to used, otherwise active
  const newStatus = card[0].currentBalance === 0 ? 'used' : 'active';
  
  await db.update(giftCards)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));
}

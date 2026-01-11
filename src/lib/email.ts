import { Resend } from 'resend';
import { Order, OrderItem } from '@/db/schema';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'Marie Lou <hello@marieloucoffee.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'marcel@marielou.de';

// Brand-specific configuration
interface BrandConfig {
  name: string;
  fromEmail: string;
  baseUrl: string;
  primaryColor: string;
  logoUrl: string;
}

function getBrandConfig(brand: string = 'coffee'): BrandConfig {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  if (brand === 'tea') {
    return {
      name: 'Marie Lou Tea',
      fromEmail: process.env.EMAIL_FROM_TEA || EMAIL_FROM.replace('Coffee', 'Tea'),
      baseUrl,
      primaryColor: '#2D5A27', // Green for tea
      logoUrl: `${baseUrl}/images/logos/marieloutea.png`,
    };
  }
  
  return {
    name: 'Marie Lou Coffee',
    fromEmail: EMAIL_FROM,
    baseUrl,
    primaryColor: '#6B4423', // Brown for coffee
    logoUrl: `${baseUrl}/images/logos/marieloucoffee.png`,
  };
}

// Types for email data
export interface OrderEmailData {
  order: Order;
  items: OrderItem[];
  locale?: 'de' | 'en';
}

export interface TrackingEmailData extends OrderEmailData {
  trackingNumber: string;
  trackingUrl?: string;
}

// ============================================================================
// Customer Emails
// ============================================================================

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const { order, items, locale = 'de' } = data;
  const brand = getBrandConfig(order.brand);
  
  const subject = locale === 'de'
    ? `Bestellbestätigung #${order.orderNumber}`
    : `Order Confirmation #${order.orderNumber}`;
  
  try {
    const { error } = await resend.emails.send({
      from: brand.fromEmail,
      to: order.email,
      subject,
      html: generateOrderConfirmationHtml(order, items, brand, locale),
    });
    
    if (error) {
      console.error('Failed to send order confirmation email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Order confirmation email sent to ${order.email} for order ${order.orderNumber}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending order confirmation email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send shipping notification email to customer
 */
export async function sendShippingNotificationEmail(data: TrackingEmailData): Promise<{ success: boolean; error?: string }> {
  const { order, items, trackingNumber, trackingUrl, locale = 'de' } = data;
  const brand = getBrandConfig(order.brand);
  
  const subject = locale === 'de'
    ? `Deine Bestellung #${order.orderNumber} ist unterwegs!`
    : `Your order #${order.orderNumber} is on its way!`;
  
  try {
    const { error } = await resend.emails.send({
      from: brand.fromEmail,
      to: order.email,
      subject,
      html: generateShippingNotificationHtml(order, items, trackingNumber, trackingUrl, brand, locale),
    });
    
    if (error) {
      console.error('Failed to send shipping notification email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Shipping notification email sent to ${order.email} for order ${order.orderNumber}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending shipping notification email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send delivery confirmation email to customer
 */
export async function sendDeliveryConfirmationEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const { order, items, locale = 'de' } = data;
  const brand = getBrandConfig(order.brand);
  
  const subject = locale === 'de'
    ? `Deine Bestellung #${order.orderNumber} wurde geliefert!`
    : `Your order #${order.orderNumber} has been delivered!`;
  
  try {
    const { error } = await resend.emails.send({
      from: brand.fromEmail,
      to: order.email,
      subject,
      html: generateDeliveryConfirmationHtml(order, items, brand, locale),
    });
    
    if (error) {
      console.error('Failed to send delivery confirmation email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Delivery confirmation email sent to ${order.email} for order ${order.orderNumber}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending delivery confirmation email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send review request email to customer
 */
export async function sendReviewRequestEmail(
  order: Order, 
  locale: 'de' | 'en' = 'de'
): Promise<{ success: boolean; error?: string }> {
  const brand = getBrandConfig(order.brand);
  
  const subject = locale === 'de'
    ? `Wie war dein Kaffee? Teile deine Erfahrung!`
    : `How was your coffee? Share your experience!`;
  
  try {
    const { error } = await resend.emails.send({
      from: brand.fromEmail,
      to: order.email,
      subject,
      html: generateReviewRequestHtml(order, brand, locale),
    });
    
    if (error) {
      console.error('Failed to send review request email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Review request email sent to ${order.email} for order ${order.orderNumber}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending review request email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale: 'de' | 'en' = 'de',
  brand: string = 'coffee'
): Promise<{ success: boolean; error?: string }> {
  const brandConfig = getBrandConfig(brand);
  
  const subject = locale === 'de'
    ? 'Passwort zurücksetzen'
    : 'Reset your password';
  
  const resetUrl = `${brandConfig.baseUrl}/${locale}/account/reset-password?token=${token}`;
  
  try {
    const { error } = await resend.emails.send({
      from: brandConfig.fromEmail,
      to: email,
      subject,
      html: generatePasswordResetHtml(resetUrl, brandConfig, locale),
    });
    
    if (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Password reset email sent to ${email}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending password reset email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send welcome email to new customer
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  referralCode: string,
  locale: 'de' | 'en' = 'de',
  brand: string = 'coffee'
): Promise<{ success: boolean; error?: string }> {
  const brandConfig = getBrandConfig(brand);
  
  const subject = locale === 'de'
    ? `Willkommen bei ${brandConfig.name}!`
    : `Welcome to ${brandConfig.name}!`;
  
  try {
    const { error } = await resend.emails.send({
      from: brandConfig.fromEmail,
      to: email,
      subject,
      html: generateWelcomeHtml(firstName, referralCode, brandConfig, locale),
    });
    
    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Welcome email sent to ${email}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending welcome email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Admin Emails
// ============================================================================

/**
 * Send new order notification to admin
 */
export async function sendAdminNewOrderEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const { order, items } = data;
  const brand = getBrandConfig(order.brand);
  
  const subject = `🛒 Neue Bestellung #${order.orderNumber} - €${(order.total / 100).toFixed(2)}`;
  
  try {
    const { error } = await resend.emails.send({
      from: brand.fromEmail,
      to: ADMIN_EMAIL,
      subject,
      html: generateAdminNewOrderHtml(order, items, brand),
    });
    
    if (error) {
      console.error('Failed to send admin new order email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Admin new order email sent for order ${order.orderNumber}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending admin new order email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send daily summary to admin
 */
export async function sendAdminDailySummaryEmail(summary: {
  date: string;
  ordersCount: number;
  revenue: number;
  newCustomers: number;
  pendingOrders: number;
  processingOrders: number;
}): Promise<{ success: boolean; error?: string }> {
  const brand = getBrandConfig();
  
  const subject = `📊 Tagesübersicht ${summary.date} - ${summary.ordersCount} Bestellungen, €${(summary.revenue / 100).toFixed(2)}`;
  
  try {
    const { error } = await resend.emails.send({
      from: brand.fromEmail,
      to: ADMIN_EMAIL,
      subject,
      html: generateAdminDailySummaryHtml(summary, brand),
    });
    
    if (error) {
      console.error('Failed to send admin daily summary email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Admin daily summary email sent for ${summary.date}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending admin daily summary email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send low stock alert to admin
 */
export async function sendAdminLowStockAlertEmail(lowStockProducts: {
  name: string;
  currentStock: number;
  threshold: number;
}[]): Promise<{ success: boolean; error?: string }> {
  const brand = getBrandConfig();
  
  const subject = `⚠️ Niedriger Lagerbestand - ${lowStockProducts.length} Produkte`;
  
  try {
    const { error } = await resend.emails.send({
      from: brand.fromEmail,
      to: ADMIN_EMAIL,
      subject,
      html: generateAdminLowStockAlertHtml(lowStockProducts, brand),
    });
    
    if (error) {
      console.error('Failed to send admin low stock alert email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Admin low stock alert email sent for ${lowStockProducts.length} products`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending admin low stock alert email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// HTML Template Generators
// ============================================================================

function getBaseStyles(brand: BrandConfig): string {
  return `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: ${brand.primaryColor}; padding: 30px; text-align: center; }
    .header img { max-width: 150px; height: auto; }
    .header h1 { color: #ffffff; margin: 15px 0 0 0; font-size: 24px; }
    .content { padding: 30px; }
    .footer { background-color: #f9f9f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background-color: ${brand.primaryColor}; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .order-summary { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .order-item:last-child { border-bottom: none; }
    .total-row { font-weight: 600; font-size: 18px; padding-top: 15px; border-top: 2px solid ${brand.primaryColor}; }
    .address-box { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 10px 0; }
    h2 { color: ${brand.primaryColor}; }
    a { color: ${brand.primaryColor}; }
  `;
}

function wrapInTemplate(content: string, brand: BrandConfig): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${getBaseStyles(brand)}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${brand.logoUrl}" alt="${brand.name}" />
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>${brand.name}</p>
          <p>Mit Liebe geröstet ♥</p>
          <p><a href="${brand.baseUrl}">Website</a> | <a href="${brand.baseUrl}/legal/impressum">Impressum</a> | <a href="${brand.baseUrl}/legal/datenschutz">Datenschutz</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date | number | null, locale: 'de' | 'en' = 'de'): string {
  if (!date) return '-';
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function generateOrderConfirmationHtml(
  order: Order,
  items: OrderItem[],
  brand: BrandConfig,
  locale: 'de' | 'en'
): string {
  const t = locale === 'de' ? {
    greeting: `Hallo ${order.firstName},`,
    thankYou: 'vielen Dank für deine Bestellung!',
    orderNumber: 'Bestellnummer',
    orderDate: 'Bestelldatum',
    summary: 'Bestellübersicht',
    qty: 'Menge',
    subtotal: 'Zwischensumme',
    shipping: 'Versand',
    discount: 'Rabatt',
    total: 'Gesamt',
    shippingAddress: 'Lieferadresse',
    nextSteps: 'Wie geht es weiter?',
    step1: 'Wir rösten deinen Kaffee innerhalb von 24 Stunden nach Bestelleingang.',
    step2: 'Du erhältst eine E-Mail mit Tracking-Informationen, sobald deine Bestellung versendet wurde.',
    step3: 'Mit der Lieferung kannst du innerhalb von 3-5 Werktagen rechnen.',
    questions: 'Fragen? Antworte einfach auf diese E-Mail.',
    signature: '— Marcel & das Marie Lou Team',
  } : {
    greeting: `Hello ${order.firstName},`,
    thankYou: 'thank you for your order!',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    summary: 'Order Summary',
    qty: 'Qty',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    discount: 'Discount',
    total: 'Total',
    shippingAddress: 'Shipping Address',
    nextSteps: 'What happens next?',
    step1: 'We\'ll roast your coffee within 24 hours of receiving your order.',
    step2: 'You\'ll receive an email with tracking information once your order ships.',
    step3: 'Expect delivery within 3-5 business days.',
    questions: 'Questions? Just reply to this email.',
    signature: '— Marcel & the Marie Lou Team',
  };

  const itemsHtml = items.map(item => `
    <div class="order-item">
      <div>
        <strong>${item.productName}</strong><br>
        <small>${item.variantName} × ${item.quantity}</small>
      </div>
      <div>${formatPrice(item.totalPrice)}</div>
    </div>
  `).join('');

  const content = `
    <h1 style="margin-top: 0;">${t.greeting}</h1>
    <p>${t.thankYou}</p>
    
    <div style="margin: 20px 0;">
      <strong>${t.orderNumber}:</strong> ${order.orderNumber}<br>
      <strong>${t.orderDate}:</strong> ${formatDate(order.createdAt, locale)}
    </div>
    
    <h2>${t.summary}</h2>
    <div class="order-summary">
      ${itemsHtml}
      <div class="order-item">
        <div>${t.subtotal}</div>
        <div>${formatPrice(order.subtotal)}</div>
      </div>
      <div class="order-item">
        <div>${t.shipping}</div>
        <div>${order.shippingCost === 0 ? (locale === 'de' ? 'Kostenlos' : 'Free') : formatPrice(order.shippingCost)}</div>
      </div>
      ${order.discount > 0 ? `
      <div class="order-item" style="color: green;">
        <div>${t.discount}</div>
        <div>-${formatPrice(order.discount)}</div>
      </div>
      ` : ''}
      <div class="order-item total-row">
        <div>${t.total}</div>
        <div>${formatPrice(order.total)}</div>
      </div>
    </div>
    
    <h2>${t.shippingAddress}</h2>
    <div class="address-box">
      ${order.shippingFirstName} ${order.shippingLastName}<br>
      ${order.shippingCompany ? `${order.shippingCompany}<br>` : ''}
      ${order.shippingLine1}<br>
      ${order.shippingLine2 ? `${order.shippingLine2}<br>` : ''}
      ${order.shippingPostalCode} ${order.shippingCity}<br>
      ${order.shippingCountry}
    </div>
    
    <h2>${t.nextSteps}</h2>
    <ol>
      <li>${t.step1}</li>
      <li>${t.step2}</li>
      <li>${t.step3}</li>
    </ol>
    
    <p style="margin-top: 30px;">${t.questions}</p>
    <p>${t.signature}</p>
  `;

  return wrapInTemplate(content, brand);
}

function generateShippingNotificationHtml(
  order: Order,
  items: OrderItem[],
  trackingNumber: string,
  trackingUrl: string | undefined,
  brand: BrandConfig,
  locale: 'de' | 'en'
): string {
  const t = locale === 'de' ? {
    greeting: `Hallo ${order.firstName},`,
    shipped: 'Deine Bestellung ist unterwegs!',
    description: `Wir haben deine Bestellung #${order.orderNumber} gerade verschickt.`,
    trackingNumber: 'Sendungsnummer',
    trackPackage: 'Sendung verfolgen',
    whatsInside: 'Was ist drin?',
    delivery: 'Mit der Lieferung kannst du innerhalb von 2-4 Werktagen rechnen.',
    enjoy: 'Wir hoffen, du genießt deinen frisch gerösteten Kaffee!',
    signature: '— Marcel & das Marie Lou Team',
  } : {
    greeting: `Hello ${order.firstName},`,
    shipped: 'Your order is on its way!',
    description: `We\'ve just shipped your order #${order.orderNumber}.`,
    trackingNumber: 'Tracking Number',
    trackPackage: 'Track Package',
    whatsInside: 'What\'s inside?',
    delivery: 'Expect delivery within 2-4 business days.',
    enjoy: 'We hope you enjoy your freshly roasted coffee!',
    signature: '— Marcel & the Marie Lou Team',
  };

  const itemsList = items.map(item => `<li>${item.productName} (${item.variantName}) × ${item.quantity}</li>`).join('');

  const content = `
    <h1 style="margin-top: 0;">📦 ${t.shipped}</h1>
    <p>${t.greeting}</p>
    <p>${t.description}</p>
    
    <div class="order-summary" style="text-align: center;">
      <p><strong>${t.trackingNumber}:</strong><br>${trackingNumber}</p>
      ${trackingUrl ? `<a href="${trackingUrl}" class="button">${t.trackPackage}</a>` : ''}
    </div>
    
    <h2>${t.whatsInside}</h2>
    <ul>${itemsList}</ul>
    
    <p>${t.delivery}</p>
    <p>${t.enjoy}</p>
    <p>${t.signature}</p>
  `;

  return wrapInTemplate(content, brand);
}

function generateDeliveryConfirmationHtml(
  order: Order,
  items: OrderItem[],
  brand: BrandConfig,
  locale: 'de' | 'en'
): string {
  const t = locale === 'de' ? {
    greeting: `Hallo ${order.firstName},`,
    delivered: 'Deine Bestellung wurde geliefert!',
    description: `Deine Bestellung #${order.orderNumber} sollte jetzt bei dir angekommen sein.`,
    enjoy: 'Wir hoffen, du genießt deinen frisch gerösteten Kaffee!',
    feedback: 'Wir würden uns über deine Meinung freuen:',
    leaveReview: 'Bewertung abgeben',
    questions: 'Fragen oder Probleme? Antworte einfach auf diese E-Mail.',
    signature: '— Marcel & das Marie Lou Team',
  } : {
    greeting: `Hello ${order.firstName},`,
    delivered: 'Your order has been delivered!',
    description: `Your order #${order.orderNumber} should have arrived by now.`,
    enjoy: 'We hope you enjoy your freshly roasted coffee!',
    feedback: 'We\'d love to hear what you think:',
    leaveReview: 'Leave a Review',
    questions: 'Questions or issues? Just reply to this email.',
    signature: '— Marcel & the Marie Lou Team',
  };

  // Assume first item for review link
  const firstItem = items[0];
  const reviewUrl = firstItem 
    ? `${brand.baseUrl}/${locale}/shop/${firstItem.productSlug}?review=true&order=${order.id}`
    : `${brand.baseUrl}/${locale}/shop`;

  const content = `
    <h1 style="margin-top: 0;">✅ ${t.delivered}</h1>
    <p>${t.greeting}</p>
    <p>${t.description}</p>
    <p>${t.enjoy}</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <p>${t.feedback}</p>
      <a href="${reviewUrl}" class="button">${t.leaveReview}</a>
    </div>
    
    <p>${t.questions}</p>
    <p>${t.signature}</p>
  `;

  return wrapInTemplate(content, brand);
}

function generateReviewRequestHtml(
  order: Order,
  brand: BrandConfig,
  locale: 'de' | 'en'
): string {
  const t = locale === 'de' ? {
    greeting: `Hallo ${order.firstName},`,
    question: 'Wie war dein Kaffee?',
    description: 'Du hast vor einer Woche bei uns bestellt. Wir hoffen, er hat dir geschmeckt!',
    help: 'Dein Feedback hilft anderen Kaffeeliebhabern und uns, noch besser zu werden.',
    leaveReview: 'Bewertung abgeben',
    thanks: 'Vielen Dank für deine Unterstützung!',
    signature: '— Marcel & das Marie Lou Team',
  } : {
    greeting: `Hello ${order.firstName},`,
    question: 'How was your coffee?',
    description: 'You ordered from us a week ago. We hope you enjoyed it!',
    help: 'Your feedback helps other coffee lovers and helps us improve.',
    leaveReview: 'Leave a Review',
    thanks: 'Thank you for your support!',
    signature: '— Marcel & the Marie Lou Team',
  };

  const reviewUrl = `${brand.baseUrl}/${locale}/shop?review=true&order=${order.id}`;

  const content = `
    <h1 style="margin-top: 0;">☕ ${t.question}</h1>
    <p>${t.greeting}</p>
    <p>${t.description}</p>
    <p>${t.help}</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${reviewUrl}" class="button">${t.leaveReview}</a>
    </div>
    
    <p>${t.thanks}</p>
    <p>${t.signature}</p>
  `;

  return wrapInTemplate(content, brand);
}

function generatePasswordResetHtml(
  resetUrl: string,
  brand: BrandConfig,
  locale: 'de' | 'en'
): string {
  const t = locale === 'de' ? {
    title: 'Passwort zurücksetzen',
    description: 'Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.',
    action: 'Klicke auf den Button unten, um ein neues Passwort zu setzen:',
    resetPassword: 'Passwort zurücksetzen',
    expiry: 'Dieser Link ist 1 Stunde gültig.',
    ignore: 'Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.',
    signature: '— Das Marie Lou Team',
  } : {
    title: 'Reset Your Password',
    description: 'You requested to reset your password.',
    action: 'Click the button below to set a new password:',
    resetPassword: 'Reset Password',
    expiry: 'This link expires in 1 hour.',
    ignore: 'If you didn\'t request this, you can safely ignore this email.',
    signature: '— The Marie Lou Team',
  };

  const content = `
    <h1 style="margin-top: 0;">🔐 ${t.title}</h1>
    <p>${t.description}</p>
    <p>${t.action}</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="button">${t.resetPassword}</a>
    </div>
    
    <p><small>${t.expiry}</small></p>
    <p><small>${t.ignore}</small></p>
    <p>${t.signature}</p>
  `;

  return wrapInTemplate(content, brand);
}

function generateWelcomeHtml(
  firstName: string,
  referralCode: string,
  brand: BrandConfig,
  locale: 'de' | 'en'
): string {
  const t = locale === 'de' ? {
    welcome: `Willkommen in der Familie, ${firstName}!`,
    description: `Danke, dass du dich bei ${brand.name} angemeldet hast.`,
    accountInfo: 'Mit deinem Konto kannst du:',
    benefit1: 'Deine Bestellungen verfolgen',
    benefit2: 'Schneller zur Kasse gehen',
    benefit3: 'Freunde einladen und Gratiskaffee verdienen',
    referralTitle: 'Dein persönlicher Empfehlungscode',
    referralDescription: 'Teile diesen Code mit Freunden. Sie bekommen 20% Rabatt, du bekommst eine Gratistüte!',
    startShopping: 'Jetzt einkaufen',
    signature: '— Marcel & das Marie Lou Team',
  } : {
    welcome: `Welcome to the family, ${firstName}!`,
    description: `Thanks for creating an account with ${brand.name}.`,
    accountInfo: 'With your account you can:',
    benefit1: 'Track your orders',
    benefit2: 'Check out faster',
    benefit3: 'Invite friends and earn free coffee',
    referralTitle: 'Your Personal Referral Code',
    referralDescription: 'Share this code with friends. They get 20% off, you get a free bag!',
    startShopping: 'Start Shopping',
    signature: '— Marcel & the Marie Lou Team',
  };

  const content = `
    <h1 style="margin-top: 0;">👋 ${t.welcome}</h1>
    <p>${t.description}</p>
    
    <h2>${t.accountInfo}</h2>
    <ul>
      <li>${t.benefit1}</li>
      <li>${t.benefit2}</li>
      <li>${t.benefit3}</li>
    </ul>
    
    <div class="order-summary" style="text-align: center;">
      <h3>${t.referralTitle}</h3>
      <p style="font-size: 24px; font-weight: bold; color: ${brand.primaryColor};">${referralCode}</p>
      <p><small>${t.referralDescription}</small></p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${brand.baseUrl}/${locale}/shop" class="button">${t.startShopping}</a>
    </div>
    
    <p>${t.signature}</p>
  `;

  return wrapInTemplate(content, brand);
}

function generateAdminNewOrderHtml(
  order: Order,
  items: OrderItem[],
  brand: BrandConfig
): string {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.variantName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.totalPrice)}</td>
    </tr>
  `).join('');

  const content = `
    <h1 style="margin-top: 0;">🛒 Neue Bestellung eingegangen!</h1>
    
    <div class="order-summary">
      <h2>Bestellung #${order.orderNumber}</h2>
      <p>
        <strong>Datum:</strong> ${formatDate(order.createdAt, 'de')}<br>
        <strong>Kunde:</strong> ${order.firstName} ${order.lastName}<br>
        <strong>E-Mail:</strong> <a href="mailto:${order.email}">${order.email}</a><br>
        ${order.phone ? `<strong>Telefon:</strong> ${order.phone}<br>` : ''}
      </p>
    </div>
    
    <h2>Bestellte Artikel</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 8px; text-align: left;">Produkt</th>
          <th style="padding: 8px; text-align: left;">Variante</th>
          <th style="padding: 8px; text-align: center;">Menge</th>
          <th style="padding: 8px; text-align: right;">Preis</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <div style="margin-top: 20px; text-align: right;">
      <p>Zwischensumme: ${formatPrice(order.subtotal)}</p>
      <p>Versand: ${order.shippingCost === 0 ? 'Kostenlos' : formatPrice(order.shippingCost)}</p>
      ${order.discount > 0 ? `<p style="color: green;">Rabatt: -${formatPrice(order.discount)}</p>` : ''}
      <p style="font-size: 20px; font-weight: bold;">Gesamt: ${formatPrice(order.total)}</p>
    </div>
    
    <h2>Lieferadresse</h2>
    <div class="address-box">
      ${order.shippingFirstName} ${order.shippingLastName}<br>
      ${order.shippingCompany ? `${order.shippingCompany}<br>` : ''}
      ${order.shippingLine1}<br>
      ${order.shippingLine2 ? `${order.shippingLine2}<br>` : ''}
      ${order.shippingPostalCode} ${order.shippingCity}<br>
      ${order.shippingCountry}
    </div>
    
    ${order.customerNotes ? `
    <h2>Kundennotiz</h2>
    <div class="address-box">${order.customerNotes}</div>
    ` : ''}
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${brand.baseUrl}/admin/orders/${order.id}" class="button">Im Admin öffnen</a>
    </div>
  `;

  return wrapInTemplate(content, brand);
}

function generateAdminDailySummaryHtml(
  summary: {
    date: string;
    ordersCount: number;
    revenue: number;
    newCustomers: number;
    pendingOrders: number;
    processingOrders: number;
  },
  brand: BrandConfig
): string {
  const content = `
    <h1 style="margin-top: 0;">📊 Tagesübersicht für ${summary.date}</h1>
    
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
      <div class="order-summary" style="text-align: center;">
        <h3 style="margin: 0; color: #666;">Bestellungen</h3>
        <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: ${brand.primaryColor};">${summary.ordersCount}</p>
      </div>
      <div class="order-summary" style="text-align: center;">
        <h3 style="margin: 0; color: #666;">Umsatz</h3>
        <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: ${brand.primaryColor};">${formatPrice(summary.revenue)}</p>
      </div>
      <div class="order-summary" style="text-align: center;">
        <h3 style="margin: 0; color: #666;">Neue Kunden</h3>
        <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: ${brand.primaryColor};">${summary.newCustomers}</p>
      </div>
      <div class="order-summary" style="text-align: center;">
        <h3 style="margin: 0; color: #666;">Wartend auf Röstung</h3>
        <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: ${summary.pendingOrders > 0 ? '#f59e0b' : brand.primaryColor};">${summary.pendingOrders}</p>
      </div>
    </div>
    
    ${summary.pendingOrders > 0 || summary.processingOrders > 0 ? `
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #92400e;">⏳ Aktion erforderlich</h3>
      ${summary.pendingOrders > 0 ? `<p style="margin: 5px 0;">${summary.pendingOrders} Bestellung(en) warten auf Röstung</p>` : ''}
      ${summary.processingOrders > 0 ? `<p style="margin: 5px 0;">${summary.processingOrders} Bestellung(en) bereit zum Versand</p>` : ''}
    </div>
    ` : ''}
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${brand.baseUrl}/admin" class="button">Admin Dashboard öffnen</a>
    </div>
  `;

  return wrapInTemplate(content, brand);
}

function generateAdminLowStockAlertHtml(
  lowStockProducts: {
    name: string;
    currentStock: number;
    threshold: number;
  }[],
  brand: BrandConfig
): string {
  const productsHtml = lowStockProducts.map(p => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: ${p.currentStock === 0 ? '#dc2626' : '#f59e0b'}; font-weight: bold;">${p.currentStock}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.threshold}</td>
    </tr>
  `).join('');

  const content = `
    <h1 style="margin-top: 0;">⚠️ Niedriger Lagerbestand</h1>
    <p>Die folgenden Produkte haben den Mindestbestand unterschritten:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 10px; text-align: left;">Produkt</th>
          <th style="padding: 10px; text-align: center;">Aktuell</th>
          <th style="padding: 10px; text-align: center;">Minimum</th>
        </tr>
      </thead>
      <tbody>
        ${productsHtml}
      </tbody>
    </table>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${brand.baseUrl}/admin/products" class="button">Bestand verwalten</a>
    </div>
  `;

  return wrapInTemplate(content, brand);
}

// ============================================================================
// Gift Card Emails
// ============================================================================

/**
 * Send gift card email to recipient
 */
export async function sendGiftCardEmail(data: {
  recipientEmail: string;
  recipientName?: string;
  senderEmail: string;
  code: string;
  amount: number;
  personalMessage?: string;
  expiresAt?: Date;
  locale?: 'de' | 'en';
  brand?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { 
    recipientEmail, 
    recipientName, 
    senderEmail, 
    code, 
    amount, 
    personalMessage, 
    expiresAt,
    locale = 'de',
    brand = 'coffee'
  } = data;
  
  const brandConfig = getBrandConfig(brand);
  
  const subject = locale === 'de'
    ? `🎁 Du hast einen ${brandConfig.name} Gutschein erhalten!`
    : `🎁 You've received a ${brandConfig.name} gift card!`;
  
  try {
    const { error } = await resend.emails.send({
      from: brandConfig.fromEmail,
      to: recipientEmail,
      subject,
      html: generateGiftCardHtml({
        recipientName,
        senderEmail,
        code,
        amount,
        personalMessage,
        expiresAt,
        brandConfig,
        locale,
      }),
    });
    
    if (error) {
      console.error('Failed to send gift card email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Gift card email sent to ${recipientEmail}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending gift card email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

function generateGiftCardHtml(data: {
  recipientName?: string;
  senderEmail: string;
  code: string;
  amount: number;
  personalMessage?: string;
  expiresAt?: Date;
  brandConfig: BrandConfig;
  locale: 'de' | 'en';
}): string {
  const { recipientName, senderEmail, code, amount, personalMessage, expiresAt, brandConfig, locale } = data;
  
  const t = locale === 'de' ? {
    greeting: recipientName ? `Hallo ${recipientName}!` : 'Hallo!',
    received: 'Du hast einen Gutschein erhalten!',
    from: 'Von',
    giftCardCode: 'Dein Gutscheincode',
    value: 'Wert',
    message: 'Persönliche Nachricht',
    howToUse: 'So verwendest du den Gutschein',
    step1: 'Wähle deine Lieblingsprodukte in unserem Shop',
    step2: 'Gib den Code an der Kasse ein',
    step3: 'Der Betrag wird automatisch abgezogen',
    shopNow: 'Jetzt einkaufen',
    validUntil: 'Gültig bis',
    noExpiry: 'Dieser Gutschein hat kein Ablaufdatum.',
    terms: 'Der Gutschein kann nicht gegen Bargeld eingelöst werden. Restguthaben kann für zukünftige Bestellungen verwendet werden.',
    enjoy: 'Viel Freude mit deinem Kaffee!',
    signature: '— Das Marie Lou Team',
  } : {
    greeting: recipientName ? `Hello ${recipientName}!` : 'Hello!',
    received: 'You\'ve received a gift card!',
    from: 'From',
    giftCardCode: 'Your Gift Card Code',
    value: 'Value',
    message: 'Personal Message',
    howToUse: 'How to use your gift card',
    step1: 'Choose your favorite products in our shop',
    step2: 'Enter the code at checkout',
    step3: 'The amount will be automatically deducted',
    shopNow: 'Shop Now',
    validUntil: 'Valid until',
    noExpiry: 'This gift card does not expire.',
    terms: 'The gift card cannot be redeemed for cash. Remaining balance can be used for future orders.',
    enjoy: 'Enjoy your coffee!',
    signature: '— The Marie Lou Team',
  };

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (date: Date, loc: 'de' | 'en') => date.toLocaleDateString(loc === 'de' ? 'de-DE' : 'en-US');

  const content = `
    <h1 style="margin-top: 0;">🎁 ${t.received}</h1>
    <p>${t.greeting}</p>
    <p>${t.from}: <a href="mailto:${senderEmail}">${senderEmail}</a></p>
    
    ${personalMessage ? `
    <div class="order-summary" style="font-style: italic;">
      <p style="margin: 0;"><strong>${t.message}:</strong></p>
      <p style="margin: 10px 0 0 0;">"${personalMessage}"</p>
    </div>
    ` : ''}
    
    <div style="background: linear-gradient(135deg, ${brandConfig.primaryColor} 0%, ${brandConfig.primaryColor}dd 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
      <p style="margin: 0; font-size: 14px; opacity: 0.9;">${t.giftCardCode}</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 15px 0;">${code}</p>
      <p style="margin: 0; font-size: 24px; font-weight: bold;">${t.value}: ${formatPrice(amount)}</p>
    </div>
    
    <h2>${t.howToUse}</h2>
    <ol>
      <li>${t.step1}</li>
      <li>${t.step2}</li>
      <li>${t.step3}</li>
    </ol>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${brandConfig.baseUrl}/${locale}/shop" class="button">${t.shopNow}</a>
    </div>
    
    <p><small>${expiresAt ? `${t.validUntil}: ${formatDate(expiresAt, locale)}` : t.noExpiry}</small></p>
    <p><small>${t.terms}</small></p>
    
    <p style="margin-top: 30px;">${t.enjoy}</p>
    <p>${t.signature}</p>
  `;

  return wrapInTemplate(content, brandConfig);
}

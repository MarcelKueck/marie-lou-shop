import { Resend } from 'resend';
import { B2BCompany, SmartBox } from '@/db/schema';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const B2B_EMAIL_FROM = process.env.B2B_EMAIL_FROM || 'Marie Lou B2B <b2b@marieloucoffee.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'marcel@marielou.de';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// B2B Brand colors
const B2B_PRIMARY = '#1a365d'; // Professional dark blue
const B2B_ACCENT = '#4299e1'; // Lighter blue accent

// ============================================================================
// B2B Email Templates - Base Layout
// ============================================================================

function b2bEmailLayout(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7fafc;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${B2B_PRIMARY}; padding: 24px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="color: #ffffff; font-size: 20px; font-weight: 700;">Marie Lou</span>
                    <span style="color: ${B2B_ACCENT}; font-size: 20px; font-weight: 700;"> B2B</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #718096; text-align: center;">
                © ${new Date().getFullYear()} Marie Lou Coffee & Tea GmbH<br>
                Musterstraße 123, 10115 Berlin, Germany
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #718096; text-align: center;">
                Questions? Contact us at <a href="mailto:b2b@marieloucoffee.com" style="color: ${B2B_ACCENT};">b2b@marieloucoffee.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// ============================================================================
// B2B Inquiry Confirmation
// ============================================================================

export interface B2BInquiryEmailData {
  companyName: string;
  contactName: string;
  email: string;
  tier: 'flex' | 'smart';
  locale?: 'de' | 'en';
}

export async function sendB2BInquiryConfirmationEmail(data: B2BInquiryEmailData): Promise<{ success: boolean; error?: string }> {
  const { companyName, contactName, email, tier, locale = 'de' } = data;
  
  const subject = locale === 'de'
    ? 'Ihre B2B-Anfrage wurde erhalten'
    : 'Your B2B inquiry has been received';
  
  const tierName = tier === 'smart' ? 'B2B Smart' : 'B2B Flex';
  
  const content = locale === 'de' ? `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Vielen Dank für Ihre Anfrage!
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hallo ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      wir haben Ihre B2B-Anfrage für <strong>${companyName}</strong> erhalten und werden diese innerhalb von 1-2 Werktagen prüfen.
    </p>
    <div style="background-color: #ebf8ff; border-left: 4px solid ${B2B_ACCENT}; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #2b6cb0;">
        <strong>Angefragtes Programm:</strong> ${tierName}
      </p>
    </div>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Nach der Genehmigung erhalten Sie eine E-Mail mit Ihren Zugangsdaten für das B2B-Portal.
    </p>
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Mit freundlichen Grüßen,<br>
      <strong>Ihr Marie Lou B2B Team</strong>
    </p>
  ` : `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Thank you for your inquiry!
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hello ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      We have received your B2B inquiry for <strong>${companyName}</strong> and will review it within 1-2 business days.
    </p>
    <div style="background-color: #ebf8ff; border-left: 4px solid ${B2B_ACCENT}; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #2b6cb0;">
        <strong>Requested Program:</strong> ${tierName}
      </p>
    </div>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Once approved, you will receive an email with your login credentials for the B2B portal.
    </p>
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: email,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send B2B inquiry confirmation email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`B2B inquiry confirmation email sent to ${email}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending B2B inquiry confirmation email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// B2B Welcome Email (after approval)
// ============================================================================

export interface B2BWelcomeEmailData {
  company: B2BCompany;
  tempPassword: string;
  locale?: 'de' | 'en';
}

export async function sendB2BWelcomeEmail(data: B2BWelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  const { company, tempPassword, locale = 'de' } = data;
  
  const subject = locale === 'de'
    ? `Willkommen bei Marie Lou B2B, ${company.companyName}!`
    : `Welcome to Marie Lou B2B, ${company.companyName}!`;
  
  const tierName = company.tier.startsWith('smart') ? 'B2B Smart' : 'B2B Flex';
  const portalUrl = `${BASE_URL}/${locale}/b2b/login`;
  const contactName = `${company.contactFirstName} ${company.contactLastName}`;
  const discountPercent = company.promoDiscountPercent || 0;
  const paymentTerms = company.paymentTermsDays || 0;
  
  const content = locale === 'de' ? `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Ihr B2B-Account ist bereit!
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hallo ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Herzlichen Glückwunsch! Ihre B2B-Anfrage für <strong>${company.companyName}</strong> wurde genehmigt.
    </p>
    
    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 24px; margin: 24px 0; border-radius: 8px;">
      <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: ${B2B_PRIMARY};">Ihre Zugangsdaten</h2>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>E-Mail:</strong> ${company.contactEmail}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Temporäres Passwort:</strong> <code style="background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${tempPassword}</code>
      </p>
      <p style="margin: 16px 0 0; font-size: 12px; color: #718096;">
        Bitte ändern Sie Ihr Passwort nach dem ersten Login.
      </p>
    </div>
    
    <div style="background-color: #ebf8ff; border-left: 4px solid ${B2B_ACCENT}; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #2b6cb0;">
        <strong>Ihr Programm:</strong> ${tierName}<br>
        <strong>Rabatt:</strong> ${discountPercent}%<br>
        <strong>Zahlungsziel:</strong> ${paymentTerms} Tage
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${portalUrl}" style="display: inline-block; background-color: ${B2B_PRIMARY}; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
        Zum B2B Portal
      </a>
    </div>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Mit freundlichen Grüßen,<br>
      <strong>Ihr Marie Lou B2B Team</strong>
    </p>
  ` : `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Your B2B account is ready!
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hello ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Congratulations! Your B2B application for <strong>${company.companyName}</strong> has been approved.
    </p>
    
    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 24px; margin: 24px 0; border-radius: 8px;">
      <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: ${B2B_PRIMARY};">Your Login Credentials</h2>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Email:</strong> ${company.contactEmail}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Temporary Password:</strong> <code style="background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${tempPassword}</code>
      </p>
      <p style="margin: 16px 0 0; font-size: 12px; color: #718096;">
        Please change your password after your first login.
      </p>
    </div>
    
    <div style="background-color: #ebf8ff; border-left: 4px solid ${B2B_ACCENT}; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #2b6cb0;">
        <strong>Your Program:</strong> ${tierName}<br>
        <strong>Discount:</strong> ${discountPercent}%<br>
        <strong>Payment Terms:</strong> Net ${paymentTerms} days
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${portalUrl}" style="display: inline-block; background-color: ${B2B_PRIMARY}; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
        Go to B2B Portal
      </a>
    </div>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: company.contactEmail,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send B2B welcome email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`B2B welcome email sent to ${company.contactEmail}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending B2B welcome email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// B2B Order Confirmation
// ============================================================================

export interface B2BOrderEmailItem {
  productName: string;
  quantity: number;
  totalCents: number;
}

export interface B2BOrderEmailData {
  orderNumber: string;
  createdAt: Date;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  paymentDueDate?: Date | null;
  items: B2BOrderEmailItem[];
  company: B2BCompany;
  locale?: 'de' | 'en';
}

export async function sendB2BOrderConfirmationEmail(data: B2BOrderEmailData): Promise<{ success: boolean; error?: string }> {
  const { orderNumber, createdAt, subtotalCents, discountCents, shippingCents, totalCents, paymentDueDate, items, company, locale = 'de' } = data;
  
  const subject = locale === 'de'
    ? `Bestellbestätigung #${orderNumber}`
    : `Order Confirmation #${orderNumber}`;
  
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (date: Date) => date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  
  const contactName = `${company.contactFirstName} ${company.contactLastName}`;
  const discountPercent = company.promoDiscountPercent || 0;
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
        <strong>${item.productName}</strong>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
        ${formatPrice(item.totalCents)}
      </td>
    </tr>
  `).join('');
  
  const content = locale === 'de' ? `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Bestellung bestätigt!
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hallo ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      vielen Dank für Ihre Bestellung. Hier sind die Details:
    </p>
    
    <div style="background-color: #f7fafc; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; color: #4a5568;">
        <strong>Bestellnummer:</strong> ${orderNumber}<br>
        <strong>Datum:</strong> ${formatDate(createdAt)}
      </p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
      <thead>
        <tr style="border-bottom: 2px solid ${B2B_PRIMARY};">
          <th style="text-align: left; padding: 12px 0; color: ${B2B_PRIMARY};">Produkt</th>
          <th style="text-align: center; padding: 12px 0; color: ${B2B_PRIMARY};">Menge</th>
          <th style="text-align: right; padding: 12px 0; color: ${B2B_PRIMARY};">Preis</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <div style="background-color: #f7fafc; padding: 16px; border-radius: 8px;">
      <table style="width: 100%;">
        <tr>
          <td style="color: #4a5568;">Zwischensumme</td>
          <td style="text-align: right; color: #4a5568;">${formatPrice(subtotalCents)}</td>
        </tr>
        <tr>
          <td style="color: #059669;">B2B-Rabatt (${discountPercent}%)</td>
          <td style="text-align: right; color: #059669;">-${formatPrice(discountCents)}</td>
        </tr>
        <tr>
          <td style="color: #4a5568;">Versand</td>
          <td style="text-align: right; color: #4a5568;">${formatPrice(shippingCents)}</td>
        </tr>
        <tr style="border-top: 2px solid ${B2B_PRIMARY};">
          <td style="padding-top: 12px; font-weight: 700; color: ${B2B_PRIMARY};">Gesamtbetrag</td>
          <td style="padding-top: 12px; text-align: right; font-weight: 700; font-size: 18px; color: ${B2B_PRIMARY};">${formatPrice(totalCents)}</td>
        </tr>
      </table>
    </div>
    
    ${paymentDueDate ? `
    <div style="background-color: #fefcbf; border-left: 4px solid #d69e2e; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #744210;">
        <strong>Zahlungsziel:</strong> ${formatDate(paymentDueDate)}<br>
        Bitte überweisen Sie den Betrag unter Angabe der Bestellnummer.
      </p>
    </div>
    ` : ''}
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Mit freundlichen Grüßen,<br>
      <strong>Ihr Marie Lou B2B Team</strong>
    </p>
  ` : `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Order Confirmed!
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hello ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Thank you for your order. Here are the details:
    </p>
    
    <div style="background-color: #f7fafc; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; color: #4a5568;">
        <strong>Order Number:</strong> ${orderNumber}<br>
        <strong>Date:</strong> ${formatDate(createdAt)}
      </p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
      <thead>
        <tr style="border-bottom: 2px solid ${B2B_PRIMARY};">
          <th style="text-align: left; padding: 12px 0; color: ${B2B_PRIMARY};">Product</th>
          <th style="text-align: center; padding: 12px 0; color: ${B2B_PRIMARY};">Quantity</th>
          <th style="text-align: right; padding: 12px 0; color: ${B2B_PRIMARY};">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <div style="background-color: #f7fafc; padding: 16px; border-radius: 8px;">
      <table style="width: 100%;">
        <tr>
          <td style="color: #4a5568;">Subtotal</td>
          <td style="text-align: right; color: #4a5568;">${formatPrice(subtotalCents)}</td>
        </tr>
        <tr>
          <td style="color: #059669;">B2B Discount (${discountPercent}%)</td>
          <td style="text-align: right; color: #059669;">-${formatPrice(discountCents)}</td>
        </tr>
        <tr>
          <td style="color: #4a5568;">Shipping</td>
          <td style="text-align: right; color: #4a5568;">${formatPrice(shippingCents)}</td>
        </tr>
        <tr style="border-top: 2px solid ${B2B_PRIMARY};">
          <td style="padding-top: 12px; font-weight: 700; color: ${B2B_PRIMARY};">Total</td>
          <td style="padding-top: 12px; text-align: right; font-weight: 700; font-size: 18px; color: ${B2B_PRIMARY};">${formatPrice(totalCents)}</td>
        </tr>
      </table>
    </div>
    
    ${paymentDueDate ? `
    <div style="background-color: #fefcbf; border-left: 4px solid #d69e2e; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #744210;">
        <strong>Payment Due:</strong> ${formatDate(paymentDueDate)}<br>
        Please include the order number in your payment reference.
      </p>
    </div>
    ` : ''}
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: company.contactEmail,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send B2B order confirmation email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`B2B order confirmation email sent to ${company.contactEmail}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending B2B order confirmation email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// SmartBox Low Stock Alert
// ============================================================================

export interface SmartBoxAlertEmailData {
  box: SmartBox;
  company: B2BCompany;
  autoReorderTriggered?: boolean;
  locale?: 'de' | 'en';
}

export async function sendSmartBoxLowStockAlertEmail(data: SmartBoxAlertEmailData): Promise<{ success: boolean; error?: string }> {
  const { box, company, autoReorderTriggered = false, locale = 'de' } = data;
  
  const subject = locale === 'de'
    ? `⚠️ SmartBox Füllstand niedrig: ${box.locationDescription || box.deviceId}`
    : `⚠️ SmartBox Low Stock Alert: ${box.locationDescription || box.deviceId}`;
  
  const portalUrl = `${BASE_URL}/${locale}/b2b/portal/smartbox`;
  const contactName = `${company.contactFirstName} ${company.contactLastName}`;
  
  const content = locale === 'de' ? `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #c53030;">
      ⚠️ SmartBox Füllstand niedrig
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hallo ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Ihr SmartBox meldet einen niedrigen Füllstand und benötigt bald eine Nachfüllung.
    </p>
    
    <div style="background-color: #fff5f5; border: 1px solid #feb2b2; padding: 24px; margin: 24px 0; border-radius: 8px;">
      <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #c53030;">Geräteinformationen</h2>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Gerät:</strong> ${box.deviceId}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Standort:</strong> ${box.locationDescription || 'Nicht angegeben'}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Produkt:</strong> ${box.currentProductName || 'Nicht konfiguriert'}
      </p>
      <p style="margin: 0; font-size: 24px; font-weight: 700; color: #c53030;">
        Aktueller Füllstand: ${box.currentFillPercent}%
      </p>
    </div>
    
    ${autoReorderTriggered ? `
    <div style="background-color: #c6f6d5; border-left: 4px solid #38a169; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #276749;">
        <strong>Automatische Nachbestellung wurde ausgelöst.</strong><br>
        Eine Bestellung wurde automatisch erstellt.
      </p>
    </div>
    ` : `
    <div style="background-color: #fefcbf; border-left: 4px solid #d69e2e; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #744210;">
        Bitte prüfen Sie Ihren Bestand und bestellen Sie bei Bedarf nach.
      </p>
    </div>
    `}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${portalUrl}" style="display: inline-block; background-color: ${B2B_PRIMARY}; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
        SmartBox verwalten
      </a>
    </div>
  ` : `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #c53030;">
      ⚠️ SmartBox Low Stock Alert
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hello ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Your SmartBox is reporting a low fill level and will need restocking soon.
    </p>
    
    <div style="background-color: #fff5f5; border: 1px solid #feb2b2; padding: 24px; margin: 24px 0; border-radius: 8px;">
      <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #c53030;">Device Information</h2>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Device:</strong> ${box.deviceId}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Location:</strong> ${box.locationDescription || 'Not specified'}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Product:</strong> ${box.currentProductName || 'Not configured'}
      </p>
      <p style="margin: 0; font-size: 24px; font-weight: 700; color: #c53030;">
        Current Fill Level: ${box.currentFillPercent}%
      </p>
    </div>
    
    ${autoReorderTriggered ? `
    <div style="background-color: #c6f6d5; border-left: 4px solid #38a169; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #276749;">
        <strong>Auto-reorder has been triggered.</strong><br>
        An order has been automatically placed.
      </p>
    </div>
    ` : `
    <div style="background-color: #fefcbf; border-left: 4px solid #d69e2e; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #744210;">
        Please check your stock and reorder if needed.
      </p>
    </div>
    `}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${portalUrl}" style="display: inline-block; background-color: ${B2B_PRIMARY}; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
        Manage SmartBox
      </a>
    </div>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: company.contactEmail,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send SmartBox low stock alert email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`SmartBox low stock alert email sent to ${company.contactEmail}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending SmartBox low stock alert email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Admin Notification - New B2B Inquiry
// ============================================================================

export async function sendAdminB2BInquiryNotification(data: B2BInquiryEmailData): Promise<{ success: boolean; error?: string }> {
  const { companyName, contactName, email, tier } = data;
  
  const subject = `🏢 New B2B Inquiry: ${companyName}`;
  const tierName = tier === 'smart' ? 'B2B Smart' : 'B2B Flex';
  const adminUrl = `${BASE_URL}/admin/b2b/companies`;
  
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      New B2B Inquiry
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      A new B2B inquiry has been submitted and requires review.
    </p>
    
    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 24px; margin: 24px 0; border-radius: 8px;">
      <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: ${B2B_PRIMARY};">Company Details</h2>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Company:</strong> ${companyName}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Contact:</strong> ${contactName}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Email:</strong> ${email}
      </p>
      <p style="margin: 0; font-size: 14px; color: #4a5568;">
        <strong>Requested Tier:</strong> ${tierName}
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${adminUrl}" style="display: inline-block; background-color: ${B2B_PRIMARY}; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
        Review in Admin Panel
      </a>
    </div>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send admin B2B inquiry notification:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Admin B2B inquiry notification sent');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending admin B2B inquiry notification:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// B2B Payment Reminder Email
// ============================================================================

export interface B2BPaymentReminderEmailData {
  companyName: string;
  contactName: string;
  email: string;
  orderNumber: string;
  amount: number;
  dueDate: Date;
  reminderLevel: number; // 1 = 7 days, 2 = 14 days, 3 = 21 days overdue
  locale?: 'de' | 'en';
}

export async function sendB2BPaymentReminderEmail(data: B2BPaymentReminderEmailData): Promise<{ success: boolean; error?: string }> {
  const { companyName, contactName, email, orderNumber, amount, dueDate, reminderLevel, locale = 'de' } = data;
  
  const urgencyMap = {
    1: { de: 'Erinnerung', en: 'Reminder' },
    2: { de: 'Zweite Mahnung', en: 'Second Notice' },
    3: { de: 'Letzte Mahnung', en: 'Final Notice' },
  };
  
  const urgency = urgencyMap[reminderLevel as keyof typeof urgencyMap] || urgencyMap[1];
  
  const subject = locale === 'de'
    ? `${urgency.de}: Zahlung ausstehend für Bestellung ${orderNumber}`
    : `${urgency.en}: Payment Due for Order ${orderNumber}`;
  
  const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const content = locale === 'de' ? `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${reminderLevel >= 3 ? '#c53030' : B2B_PRIMARY};">
      ${urgency.de}: Offene Rechnung
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hallo ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      wir möchten Sie daran erinnern, dass die Zahlung für folgende Bestellung noch aussteht:
    </p>
    
    <div style="background-color: ${reminderLevel >= 3 ? '#fff5f5' : '#f7fafc'}; border: 1px solid ${reminderLevel >= 3 ? '#fc8181' : '#e2e8f0'}; padding: 24px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Bestellnummer:</strong> ${orderNumber}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Unternehmen:</strong> ${companyName}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Betrag:</strong> €${amount.toFixed(2)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Fälligkeitsdatum:</strong> ${dueDate.toLocaleDateString('de-DE')}
      </p>
      <p style="margin: 0; font-size: 14px; color: ${reminderLevel >= 2 ? '#c53030' : '#4a5568'}; font-weight: ${reminderLevel >= 2 ? '600' : '400'};">
        <strong>Überfällig seit:</strong> ${daysOverdue} Tagen
      </p>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Bitte begleichen Sie den offenen Betrag so bald wie möglich. Bei Fragen stehen wir Ihnen gerne zur Verfügung.
    </p>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Mit freundlichen Grüßen,<br>
      <strong>Ihr Marie Lou B2B Team</strong>
    </p>
  ` : `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${reminderLevel >= 3 ? '#c53030' : B2B_PRIMARY};">
      ${urgency.en}: Outstanding Invoice
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hello ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      We would like to remind you that payment for the following order is still pending:
    </p>
    
    <div style="background-color: ${reminderLevel >= 3 ? '#fff5f5' : '#f7fafc'}; border: 1px solid ${reminderLevel >= 3 ? '#fc8181' : '#e2e8f0'}; padding: 24px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Order Number:</strong> ${orderNumber}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Company:</strong> ${companyName}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Amount:</strong> €${amount.toFixed(2)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Due Date:</strong> ${dueDate.toLocaleDateString('en-US')}
      </p>
      <p style="margin: 0; font-size: 14px; color: ${reminderLevel >= 2 ? '#c53030' : '#4a5568'}; font-weight: ${reminderLevel >= 2 ? '600' : '400'};">
        <strong>Overdue by:</strong> ${daysOverdue} days
      </p>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Please settle the outstanding amount as soon as possible. If you have any questions, please don't hesitate to contact us.
    </p>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: email,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send B2B payment reminder email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`B2B payment reminder email sent to ${email} (level ${reminderLevel})`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending B2B payment reminder email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// B2B Shipment Reminder Email
// ============================================================================

export interface B2BShipmentReminderEmailData {
  companyName: string;
  contactName: string;
  email: string;
  scheduledDate: Date;
  daysUntil: number;
  estimatedQuantity: string;
  lastOrderDate: Date | null;
  locale?: 'de' | 'en';
}

export async function sendB2BShipmentReminderEmail(data: B2BShipmentReminderEmailData): Promise<{ success: boolean; error?: string }> {
  const { companyName, contactName, email, scheduledDate, daysUntil, estimatedQuantity, lastOrderDate, locale = 'de' } = data;
  
  const subject = locale === 'de'
    ? `Ihre nächste Lieferung in ${daysUntil} Tagen`
    : `Your next shipment in ${daysUntil} days`;
  
  const content = locale === 'de' ? `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Ihre nächste Lieferung steht bevor
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hallo ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      wir möchten Sie daran erinnern, dass Ihre nächste geplante Lieferung für <strong>${companyName}</strong> in ${daysUntil} Tagen ansteht.
    </p>
    
    <div style="background-color: #ebf8ff; border-left: 4px solid ${B2B_ACCENT}; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #2b6cb0;">
        <strong>Geplantes Lieferdatum:</strong> ${scheduledDate.toLocaleDateString('de-DE')}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #2b6cb0;">
        <strong>Geschätzte Menge:</strong> ${estimatedQuantity}
      </p>
      ${lastOrderDate ? `
      <p style="margin: 0; font-size: 14px; color: #2b6cb0;">
        <strong>Letzte Bestellung:</strong> ${lastOrderDate.toLocaleDateString('de-DE')}
      </p>
      ` : ''}
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Möchten Sie Änderungen an Ihrer Bestellung vornehmen? Besuchen Sie Ihr B2B-Portal oder kontaktieren Sie uns.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${BASE_URL}/${locale}/b2b/portal" style="display: inline-block; background-color: ${B2B_PRIMARY}; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
        Zum B2B-Portal
      </a>
    </div>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Mit freundlichen Grüßen,<br>
      <strong>Ihr Marie Lou B2B Team</strong>
    </p>
  ` : `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Your next shipment is coming up
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hello ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      We would like to remind you that the next scheduled shipment for <strong>${companyName}</strong> is coming up in ${daysUntil} days.
    </p>
    
    <div style="background-color: #ebf8ff; border-left: 4px solid ${B2B_ACCENT}; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #2b6cb0;">
        <strong>Scheduled Delivery Date:</strong> ${scheduledDate.toLocaleDateString('en-US')}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #2b6cb0;">
        <strong>Estimated Quantity:</strong> ${estimatedQuantity}
      </p>
      ${lastOrderDate ? `
      <p style="margin: 0; font-size: 14px; color: #2b6cb0;">
        <strong>Last Order:</strong> ${lastOrderDate.toLocaleDateString('en-US')}
      </p>
      ` : ''}
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Would you like to make any changes to your order? Visit your B2B portal or contact us.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${BASE_URL}/${locale}/b2b/portal" style="display: inline-block; background-color: ${B2B_PRIMARY}; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
        Go to B2B Portal
      </a>
    </div>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: email,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send B2B shipment reminder email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`B2B shipment reminder email sent to ${email}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending B2B shipment reminder email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// B2B Shipment Dispatched Email
// ============================================================================

export interface B2BShipmentDispatchedEmailData {
  companyName: string;
  contactName: string;
  email: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  items: Array<{ name: string; quantity: number }>;
  locale?: 'de' | 'en';
}

export async function sendB2BShipmentDispatchedEmail(data: B2BShipmentDispatchedEmailData): Promise<{ success: boolean; error?: string }> {
  const { companyName, contactName, email, orderNumber, trackingNumber, carrier, estimatedDelivery, items, locale = 'de' } = data;
  
  const subject = locale === 'de'
    ? `Ihre Bestellung ${orderNumber} wurde versendet`
    : `Your order ${orderNumber} has been shipped`;
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #4a5568;">${item.name}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #4a5568; text-align: right;">${item.quantity}x</td>
    </tr>
  `).join('');
  
  const content = locale === 'de' ? `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Ihre Bestellung ist unterwegs! 🚚
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hallo ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Gute Nachrichten! Ihre Bestellung für <strong>${companyName}</strong> wurde versandt.
    </p>
    
    <div style="background-color: #f0fff4; border-left: 4px solid #48bb78; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #276749;">
        <strong>Bestellnummer:</strong> ${orderNumber}
      </p>
      ${carrier ? `
      <p style="margin: 0 0 8px; font-size: 14px; color: #276749;">
        <strong>Versanddienstleister:</strong> ${carrier}
      </p>
      ` : ''}
      ${trackingNumber ? `
      <p style="margin: 0 0 8px; font-size: 14px; color: #276749;">
        <strong>Sendungsnummer:</strong> ${trackingNumber}
      </p>
      ` : ''}
      ${estimatedDelivery ? `
      <p style="margin: 0; font-size: 14px; color: #276749;">
        <strong>Voraussichtliche Lieferung:</strong> ${estimatedDelivery.toLocaleDateString('de-DE')}
      </p>
      ` : ''}
    </div>
    
    <h2 style="margin: 24px 0 16px; font-size: 18px; font-weight: 600; color: ${B2B_PRIMARY};">Bestellübersicht</h2>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      ${itemsList}
    </table>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Mit freundlichen Grüßen,<br>
      <strong>Ihr Marie Lou B2B Team</strong>
    </p>
  ` : `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Your order is on its way! 🚚
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hello ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Great news! Your order for <strong>${companyName}</strong> has been shipped.
    </p>
    
    <div style="background-color: #f0fff4; border-left: 4px solid #48bb78; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #276749;">
        <strong>Order Number:</strong> ${orderNumber}
      </p>
      ${carrier ? `
      <p style="margin: 0 0 8px; font-size: 14px; color: #276749;">
        <strong>Carrier:</strong> ${carrier}
      </p>
      ` : ''}
      ${trackingNumber ? `
      <p style="margin: 0 0 8px; font-size: 14px; color: #276749;">
        <strong>Tracking Number:</strong> ${trackingNumber}
      </p>
      ` : ''}
      ${estimatedDelivery ? `
      <p style="margin: 0; font-size: 14px; color: #276749;">
        <strong>Estimated Delivery:</strong> ${estimatedDelivery.toLocaleDateString('en-US')}
      </p>
      ` : ''}
    </div>
    
    <h2 style="margin: 24px 0 16px; font-size: 18px; font-weight: 600; color: ${B2B_PRIMARY};">Order Summary</h2>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      ${itemsList}
    </table>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: email,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send B2B shipment dispatched email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`B2B shipment dispatched email sent to ${email}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending B2B shipment dispatched email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// B2B Invoice Email
// ============================================================================

export interface B2BInvoiceEmailData {
  companyName: string;
  contactName: string;
  email: string;
  invoiceNumber: string;
  orderNumber: string;
  amount: number;
  dueDate: Date;
  invoicePdfUrl?: string;
  locale?: 'de' | 'en';
}

export async function sendB2BInvoiceEmail(data: B2BInvoiceEmailData): Promise<{ success: boolean; error?: string }> {
  const { companyName, contactName, email, invoiceNumber, orderNumber, amount, dueDate, invoicePdfUrl, locale = 'de' } = data;
  
  const subject = locale === 'de'
    ? `Rechnung ${invoiceNumber} für Bestellung ${orderNumber}`
    : `Invoice ${invoiceNumber} for Order ${orderNumber}`;
  
  const content = locale === 'de' ? `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Ihre Rechnung
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hallo ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      anbei finden Sie die Rechnung für Ihre Bestellung bei Marie Lou B2B.
    </p>
    
    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 24px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Rechnungsnummer:</strong> ${invoiceNumber}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Bestellnummer:</strong> ${orderNumber}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Unternehmen:</strong> ${companyName}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Gesamtbetrag:</strong> €${amount.toFixed(2)}
      </p>
      <p style="margin: 0; font-size: 14px; color: #4a5568;">
        <strong>Fällig bis:</strong> ${dueDate.toLocaleDateString('de-DE')}
      </p>
    </div>
    
    ${invoicePdfUrl ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${invoicePdfUrl}" style="display: inline-block; background-color: ${B2B_PRIMARY}; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
        Rechnung herunterladen
      </a>
    </div>
    ` : ''}
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Bitte überweisen Sie den Betrag innerhalb der angegebenen Zahlungsfrist auf unser Konto.
    </p>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Mit freundlichen Grüßen,<br>
      <strong>Ihr Marie Lou B2B Team</strong>
    </p>
  ` : `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: ${B2B_PRIMARY};">
      Your Invoice
    </h1>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Hello ${contactName},
    </p>
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Please find attached the invoice for your order with Marie Lou B2B.
    </p>
    
    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 24px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Invoice Number:</strong> ${invoiceNumber}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Order Number:</strong> ${orderNumber}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Company:</strong> ${companyName}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568;">
        <strong>Total Amount:</strong> €${amount.toFixed(2)}
      </p>
      <p style="margin: 0; font-size: 14px; color: #4a5568;">
        <strong>Due By:</strong> ${dueDate.toLocaleDateString('en-US')}
      </p>
    </div>
    
    ${invoicePdfUrl ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${invoicePdfUrl}" style="display: inline-block; background-color: ${B2B_PRIMARY}; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
        Download Invoice
      </a>
    </div>
    ` : ''}
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Please transfer the amount within the specified payment period to our account.
    </p>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: email,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send B2B invoice email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`B2B invoice email sent to ${email}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending B2B invoice email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// V2 SmartBox Emails
// ============================================================================

interface SmartBoxOfflineEmailData {
  to: string;
  companyName: string;
  boxName: string;
  lastOnline?: Date | null;
  portalUrl: string;
}

export async function sendSmartBoxOfflineEmail(data: SmartBoxOfflineEmailData): Promise<{ success: boolean; error?: string }> {
  const { to: email, companyName, boxName, lastOnline, portalUrl } = data;
  const subject = `⚠️ SmartBox Offline - ${boxName}`;
  
  const lastOnlineStr = lastOnline 
    ? new Date(lastOnline).toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown';
  
  const content = `
    <h2 style="margin: 0 0 24px; font-size: 24px; color: #1a1a1a; font-weight: 600;">
      SmartBox Offline Alert
    </h2>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Dear ${companyName} team,
    </p>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      We haven't received any readings from your SmartBox for over 48 hours:
    </p>
    
    <div style="background: #FEF3C7; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; font-size: 16px; color: #92400E;">
        <strong>SmartBox:</strong> ${boxName}<br>
        <strong>Last Online:</strong> ${lastOnlineStr}
      </p>
    </div>
    
       
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      <strong>Possible causes:</strong>
    </p>
    <ul style="margin: 0 0 16px; padding-left: 24px; color: #4a5568; line-height: 1.8;">
      <li>Power supply disconnected</li>
      <li>WiFi connection issues</li>
      <li>Device needs restart</li>
      <li>Low battery</li>
    </ul>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Please check your SmartBox and ensure it's powered on and connected to WiFi.
    </p>
    
    <a href="${portalUrl}" style="display: inline-block; background: #1a5f4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      View SmartBox Status
    </a>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: email,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send SmartBox offline email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`SmartBox offline email sent to ${email}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending SmartBox offline email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

interface RestockReminderEmailData {
  to: string;
  companyName: string;
  boxName: string;
  productName: string;
  deliveredDate: Date;
  reminderNumber: number;
  portalUrl: string;
}

export async function sendRestockReminderEmail(data: RestockReminderEmailData): Promise<{ success: boolean; error?: string }> {
  const { to: email, companyName, boxName, productName, deliveredDate, reminderNumber, portalUrl } = data;
  const subject = reminderNumber === 1 
    ? `📦 Reminder: Place your coffee bags in the SmartBox` 
    : `📦 Second Reminder: Don't forget to restock your SmartBox`;
  
  const deliveredStr = deliveredDate.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric'
  });
  
  const content = `
    <h2 style="margin: 0 0 24px; font-size: 24px; color: #1a1a1a; font-weight: 600;">
      Restock Reminder
    </h2>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Dear ${companyName} team,
    </p>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Your coffee delivery from ${deliveredStr} is waiting to be placed in your SmartBox!
    </p>
    
    <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; font-size: 16px; color: #166534;">
        <strong>Product:</strong> ${productName}<br>
        <strong>SmartBox:</strong> ${boxName}
      </p>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      <strong>Why this matters:</strong> Once you place the sealed bags in your SmartBox, our system can accurately track your consumption and ensure timely reorders - so you never run out of great coffee!
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Once restocked, please confirm in your portal so we can update our records.
    </p>
    
    <a href="${portalUrl}" style="display: inline-block; background: #1a5f4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Confirm Restock
    </a>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: email,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send restock reminder email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Restock reminder email sent to ${email}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending restock reminder email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

interface ConsumptionChangeEmailData {
  to: string;
  companyName: string;
  boxName: string;
  oldConsumption: number; // grams per day
  newConsumption: number; // grams per day
  percentChange: number;
  recommendation?: string;
  portalUrl: string;
}

export async function sendConsumptionChangeEmail(data: ConsumptionChangeEmailData): Promise<{ success: boolean; error?: string }> {
  const { to: email, companyName, boxName, oldConsumption, newConsumption, percentChange, recommendation, portalUrl } = data;
  
  const changeDirection = percentChange > 0 ? 'increased' : 'decreased';
  const absChange = Math.abs(Math.round(percentChange));
  const subject = `📊 Consumption ${changeDirection} by ${absChange}% - ${boxName}`;
  
  const content = `
    <h2 style="margin: 0 0 24px; font-size: 24px; color: #1a1a1a; font-weight: 600;">
      Consumption Pattern Change Detected
    </h2>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Dear ${companyName} team,
    </p>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      We've noticed a significant change in coffee consumption at your SmartBox "${boxName}":
    </p>
    
    <div style="background: ${percentChange > 0 ? '#DBEAFE' : '#FEF3C7'}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; font-size: 16px; color: ${percentChange > 0 ? '#1E40AF' : '#92400E'};">
        <strong>Previous:</strong> ~${Math.round(oldConsumption)}g/day<br>
        <strong>Current:</strong> ~${Math.round(newConsumption)}g/day<br>
        <strong>Change:</strong> ${percentChange > 0 ? '+' : ''}${absChange}%
      </p>
    </div>
    
    ${recommendation ? `
    <div style="background: #F0FDF4; border-left: 4px solid #22C55E; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 16px; color: #166534;">
        <strong>💡 Recommendation:</strong> ${recommendation}
      </p>
    </div>
    ` : ''}
    
    <p style="margin: 0 0 24px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      We've automatically adjusted our predictions to ensure you continue receiving deliveries at the optimal time. You can review and adjust your order settings in the portal.
    </p>
    
    <a href="${portalUrl}" style="display: inline-block; background: #1a5f4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      View Consumption Stats
    </a>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: email,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send consumption change email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Consumption change email sent to ${email}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending consumption change email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

interface LearningModeCompleteEmailData {
  to: string;
  companyName: string;
  boxName: string;
  avgDailyConsumption: number; // grams
  avgWeeklyConsumption: number; // grams
  estimatedBagsPerWeek: number;
  recommendedBagsPerOrder: number;
  portalUrl: string;
}

export async function sendLearningModeCompleteEmail(data: LearningModeCompleteEmailData): Promise<{ success: boolean; error?: string }> {
  const { to: email, companyName, boxName, avgDailyConsumption, avgWeeklyConsumption, estimatedBagsPerWeek, recommendedBagsPerOrder, portalUrl } = data;
  const subject = `✅ SmartBox Learning Complete - ${boxName}`;
  
  const content = `
    <h2 style="margin: 0 0 24px; font-size: 24px; color: #1a1a1a; font-weight: 600;">
      Learning Mode Complete! 🎉
    </h2>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Dear ${companyName} team,
    </p>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Great news! Your SmartBox "${boxName}" has completed its 2-week learning period. We now have a clear picture of your coffee consumption patterns:
    </p>
    
    <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; font-size: 18px; color: #166534;">Your Consumption Profile</h3>
      <p style="margin: 0; font-size: 16px; color: #166534; line-height: 1.8;">
        <strong>Daily Average:</strong> ~${Math.round(avgDailyConsumption)}g/day<br>
        <strong>Weekly Average:</strong> ~${Math.round(avgWeeklyConsumption)}g/week<br>
        <strong>Estimated Bags/Week:</strong> ~${estimatedBagsPerWeek.toFixed(1)} bags<br>
        <strong>Recommended Order Size:</strong> ${recommendedBagsPerOrder} bags
      </p>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      <strong>What happens now:</strong>
    </p>
    <ul style="margin: 0 0 16px; padding-left: 24px; color: #4a5568; line-height: 1.8;">
      <li>Auto-reordering is now active based on real consumption data</li>
      <li>We'll notify you if consumption patterns change significantly</li>
      <li>You'll always have fresh coffee without manual ordering</li>
    </ul>
    
    <p style="margin: 0 0 24px; font-size: 16px; color: #4a5568; line-height: 1.6;">
      You can adjust your order preferences anytime in your portal.
    </p>
    
    <a href="${portalUrl}" style="display: inline-block; background: #1a5f4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      View SmartBox Dashboard
    </a>
    
    <p style="margin: 24px 0 0; font-size: 16px; color: #4a5568; line-height: 1.6;">
      Best regards,<br>
      <strong>Your Marie Lou B2B Team</strong>
    </p>
  `;
  
  try {
    const { error } = await resend.emails.send({
      from: B2B_EMAIL_FROM,
      to: email,
      subject,
      html: b2bEmailLayout(content, subject),
    });
    
    if (error) {
      console.error('Failed to send learning mode complete email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Learning mode complete email sent to ${email}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending learning mode complete email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

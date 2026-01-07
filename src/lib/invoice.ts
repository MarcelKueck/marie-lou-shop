import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { siteConfig } from '@/config/site';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Client, type DocumentCreateRequest as APIDocumentCreateRequest, type SenderParty as APISenderParty, type RecipientParty as APIRecipientParty } from '@rechnungs-api/client';

const RECHNUNGS_API_KEY = process.env.RECHNUNGS_API_KEY;

interface DocumentCreateRequest {
  locale: string;
  type: 'invoice';
  eInvoice?: {
    type: 'zugferd';
    profile: 'xrechnung' | 'basic' | 'comfort' | 'extended';
  };
  number: string;
  issueDate: string;
  dueDate: string;
  deliveryPeriod?: {
    startDate: string;
    endDate: string;
  };
  sender: SenderParty;
  recipient: RecipientParty;
  buyerReference?: string;
  payment: {
    means: PaymentMeans[];
    terms: string;
  };
  preTableText?: string;
  postTableText?: string;
  lines: InvoiceLine[];
  theme?: {
    logo?: string;
    fontFamily?: string;
    template?: {
      id: string;
      options?: Record<string, string>;
    };
  };
}

interface SenderParty {
  name: string;
  address: {
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    region?: string;
    country: string;
  };
  electronicAddress?: {
    scheme: string;
    value: string;
  };
  contact?: {
    name: string;
    email: string;
    phone?: string;
    website?: string;
  };
  vatId?: string;
  taxId?: string;
  owner?: string;
  registration?: {
    office: string;
    number: string;
  };
}

interface RecipientParty {
  name: string;
  address: {
    line1: string;
    line2?: string;
    line3?: string;
    postalCode: string;
    city: string;
    region?: string;
    country: string;
  };
  electronicAddress?: {
    scheme: string;
    value: string;
  };
  contact?: {
    name: string;
    email: string;
    phone?: string;
  };
  vatId?: string;
}

interface PaymentMeans {
  code: string;
  bankAccount?: {
    bankName: string;
    iban: string;
    bic: string;
  };
}

interface InvoiceLine {
  unitPrice: {
    value: string;
    currency: string;
  };
  item: {
    name: string;
    description?: string;
    vat: {
      code: string;
      rate: string;
    };
  };
  quantity: {
    value: string;
    unit: string;
  };
}

interface CreateDocumentResponse {
  id: string;
  number: string;
  status: string;
}

/**
 * Generate invoice number from order number
 */
function generateInvoiceNumber(orderNumber: string): string {
  // Convert order number to invoice number
  // ML260107-K8Z0 -> RE-260107-K8Z0
  return `RE-${orderNumber.replace('ML', '')}`;
}

/**
 * Format date for API (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get company logo as base64
 */
async function getLogoBase64(): Promise<string | undefined> {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logos', 'marieloucoffee.png');
    const logoBuffer = await fs.readFile(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Failed to load logo:', error);
    return undefined;
  }
}

/**
 * Get the rechnungs-api client
 */
function getApiClient(): Client {
  if (!RECHNUNGS_API_KEY) {
    throw new Error('RECHNUNGS_API_KEY not configured');
  }
  return new Client({ apiKey: RECHNUNGS_API_KEY });
}

/**
 * Create invoice document via rechnungs-api.de
 */
async function createInvoiceDocument(request: DocumentCreateRequest): Promise<CreateDocumentResponse> {
  const client = getApiClient();
  
  // Convert our internal types to API types
  const apiRequest: APIDocumentCreateRequest = {
    locale: request.locale as APIDocumentCreateRequest['locale'],
    type: request.type,
    eInvoice: request.eInvoice ? {
      type: 'zugferd',
      profile: request.eInvoice.profile as 'basic' | 'extended',
    } : undefined,
    number: request.number,
    issueDate: request.issueDate,
    dueDate: request.dueDate,
    buyerReference: request.buyerReference,
    deliveryPeriod: request.deliveryPeriod,
    sender: request.sender as APISenderParty,
    recipient: request.recipient as APIRecipientParty,
    payment: {
      means: request.payment.means.map(m => ({
        code: m.code as '30',
        bankAccount: m.bankAccount ? {
          bankName: m.bankAccount.bankName,
          iban: m.bankAccount.iban as `${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}`,
          bic: m.bankAccount.bic as `${string}${string}${string}${string}${string}${string}${string}${string}`,
        } : undefined,
      })),
      terms: request.payment.terms,
    },
    preTableText: request.preTableText,
    postTableText: request.postTableText,
    lines: request.lines.map(line => ({
      unitPrice: {
        value: line.unitPrice.value as `${number}`,
        currency: line.unitPrice.currency as 'EUR',
      },
      item: {
        name: line.item.name,
        description: line.item.description,
        vat: {
          code: line.item.vat.code as 'S',
          rate: line.item.vat.rate as `${number}`,
        },
      },
      quantity: {
        value: line.quantity.value as `${number}`,
        unit: line.quantity.unit as 'H87',
      },
    })),
    theme: request.theme ? { logo: request.theme.logo as `data:${string}` } : undefined,
  };

  const document = await client.createDocument(apiRequest);
  return {
    id: document.id,
    number: document.number,
    status: 'created',
  };
}

/**
 * Get invoice PDF from rechnungs-api.de
 */
async function getInvoicePdf(documentId: string): Promise<ArrayBuffer> {
  const client = getApiClient();
  return client.readDocument(documentId, 'pdf');
}

/**
 * Generate and store invoice for an order
 */
export async function generateInvoiceForOrder(orderId: string): Promise<{ invoiceId: string; invoiceNumber: string }> {
  // Get order with items
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Check if invoice already exists
  if (order.invoiceId) {
    return {
      invoiceId: order.invoiceId,
      invoiceNumber: order.invoiceNumber!,
    };
  }

  // Get order items
  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
  });

  const invoiceNumber = generateInvoiceNumber(order.orderNumber);
  const issueDate = order.paidAt || order.createdAt;
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 14); // 14 days payment term

  // Parse company address
  const addressParts = siteConfig.legal.address.split(',').map(s => s.trim());
  const streetAddress = addressParts[0] || '';
  const cityParts = addressParts[1]?.split(' ') || [];
  const postalCode = cityParts[0] || '';
  const city = cityParts.slice(1).join(' ') || '';

  // Build sender (company) info
  const sender: SenderParty = {
    name: siteConfig.legal.companyName,
    address: {
      line1: streetAddress,
      postalCode: postalCode,
      city: city,
      country: 'DE',
    },
    electronicAddress: {
      scheme: 'EM',
      value: siteConfig.support.email,
    },
    contact: {
      name: siteConfig.legal.managingDirector,
      email: siteConfig.support.email,
      phone: siteConfig.support.phone,
    },
    vatId: siteConfig.legal.vatId,
    owner: siteConfig.legal.managingDirector,
    registration: {
      office: siteConfig.legal.registrationCourt,
      number: siteConfig.legal.registrationNumber,
    },
  };

  // Build recipient (customer) info
  // Handle potentially missing shipping address data (can happen if Stripe checkout doesn't require shipping)
  const recipientName = `${order.shippingFirstName || order.firstName} ${order.shippingLastName || order.lastName}`.trim() || 'Customer';
  const recipientLine1 = order.shippingLine1 || 'Address not provided';
  const recipientPostalCode = order.shippingPostalCode || '00000';
  const recipientCity = order.shippingCity || 'Unknown';
  const recipientCountry = order.shippingCountry || 'DE';
  
  const recipient: RecipientParty = {
    name: recipientName,
    address: {
      line1: recipientLine1,
      line2: order.shippingLine2 || undefined,
      postalCode: recipientPostalCode,
      city: recipientCity,
      country: recipientCountry,
    },
    electronicAddress: {
      scheme: 'EM',
      value: order.email,
    },
    contact: {
      name: `${order.firstName} ${order.lastName}`.trim() || recipientName,
      email: order.email,
      phone: order.phone || undefined,
    },
  };

  // Build invoice lines from order items
  const lines: InvoiceLine[] = items.map(item => ({
    unitPrice: {
      value: (item.unitPrice / 100).toFixed(2),
      currency: order.currency,
    },
    item: {
      name: item.productName,
      description: item.variantName || undefined,
      vat: {
        code: 'S', // Standard rate
        rate: `${siteConfig.taxRate}.00`,
      },
    },
    quantity: {
      value: item.quantity.toString(),
      unit: 'H87', // Piece
    },
  }));

  // Add shipping as a line item if there's a cost
  if (order.shippingCost > 0) {
    lines.push({
      unitPrice: {
        value: (order.shippingCost / 100).toFixed(2),
        currency: order.currency,
      },
      item: {
        name: 'Versand',
        description: 'Standardversand',
        vat: {
          code: 'S',
          rate: `${siteConfig.taxRate}.00`,
        },
      },
      quantity: {
        value: '1',
        unit: 'H87',
      },
    });
  }

  // Get logo
  const logo = await getLogoBase64();

  // Determine locale - API only supports de-DE and en-US
  const locale = order.shippingCountry === 'DE' ? 'de-DE' : 'en-US';

  // Build document request
  const documentRequest: DocumentCreateRequest = {
    locale,
    type: 'invoice',
    eInvoice: {
      type: 'zugferd',
      profile: 'basic',
    },
    number: invoiceNumber,
    issueDate: formatDate(issueDate),
    dueDate: formatDate(dueDate),
    buyerReference: order.orderNumber,
    deliveryPeriod: {
      startDate: formatDate(issueDate),
      endDate: formatDate(issueDate),
    },
    sender,
    recipient,
    payment: {
      means: [
        {
          code: '30', // Bank transfer
          bankAccount: {
            bankName: 'Your Bank', // TODO: Add to site config
            iban: 'DE89370400440532013000', // TODO: Add to site config
            bic: 'COBADEFFXXX', // TODO: Add to site config
          },
        },
      ],
      terms: locale === 'de-DE' 
        ? 'Bereits bezahlt per Kreditkarte/Online-Zahlung' 
        : 'Already paid via credit card/online payment',
    },
    preTableText: locale === 'de-DE'
      ? `Vielen Dank für Ihre Bestellung!\n\nRechnungsnummer: ${invoiceNumber}\nBestellnummer: ${order.orderNumber}`
      : `Thank you for your order!\n\nInvoice number: ${invoiceNumber}\nOrder number: ${order.orderNumber}`,
    postTableText: locale === 'de-DE'
      ? 'Diese Rechnung wurde maschinell erstellt und ist ohne Unterschrift gültig.\n\nVielen Dank für Ihren Einkauf bei Marie Lou Coffee!'
      : 'This invoice was generated automatically and is valid without signature.\n\nThank you for shopping at Marie Lou Coffee!',
    lines,
    theme: logo ? { logo } : undefined,
  };

  // Create invoice via API
  const document = await createInvoiceDocument(documentRequest);

  // Update order with invoice info
  await db.update(orders)
    .set({
      invoiceId: document.id,
      invoiceNumber: invoiceNumber,
      invoiceGeneratedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  return {
    invoiceId: document.id,
    invoiceNumber: invoiceNumber,
  };
}

/**
 * Download invoice PDF for an order
 */
export async function downloadInvoicePdf(orderId: string): Promise<{ pdf: ArrayBuffer; filename: string }> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Generate invoice if it doesn't exist
  let invoiceId = order.invoiceId;
  let invoiceNumber = order.invoiceNumber;

  if (!invoiceId) {
    const result = await generateInvoiceForOrder(orderId);
    invoiceId = result.invoiceId;
    invoiceNumber = result.invoiceNumber;
  }

  // Get PDF from API
  const pdf = await getInvoicePdf(invoiceId);
  const filename = `${invoiceNumber}.pdf`;

  return { pdf, filename };
}

/**
 * Check if order has an invoice
 */
export async function hasInvoice(orderId: string): Promise<boolean> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  return !!order?.invoiceId;
}

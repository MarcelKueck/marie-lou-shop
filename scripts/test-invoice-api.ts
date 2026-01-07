// Test script for rechnungs-api.de using official client
// Run with: npx tsx scripts/test-invoice-api.ts

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { Client, type DocumentCreateRequest, type SenderParty, type RecipientParty } from '@rechnungs-api/client';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const RECHNUNGS_API_KEY = process.env.RECHNUNGS_API_KEY;

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

async function testCreateInvoice() {
  if (!RECHNUNGS_API_KEY) {
    console.error('❌ RECHNUNGS_API_KEY not set in environment');
    process.exit(1);
  }

  console.log('🔑 API Key found:', RECHNUNGS_API_KEY.substring(0, 10) + '...');
  
  // Initialize the client
  const client = new Client({ apiKey: RECHNUNGS_API_KEY });
  
  const logo = await getLogoBase64();
  console.log('🖼️  Logo loaded:', logo ? 'Yes' : 'No');

  const sender: SenderParty = {
    name: 'Marie Lou Coffee UG (haftungsbeschränkt)',
    address: {
      line1: 'Musterstraße 123',
      postalCode: '80331',
      city: 'München',
      country: 'DE',
    },
    electronicAddress: {
      scheme: 'EM',
      value: 'hello@marielou.de',
    },
    contact: {
      name: 'Marcel',
      email: 'hello@marielou.de',
      phone: '+49 123 456 789',
    },
    vatId: 'DE123456789',
    owner: 'Marcel',
    registration: {
      office: 'Amtsgericht München',
      number: 'HRB 123456',
    },
  };

  const recipient: RecipientParty = {
    name: 'Marcel Kueck',
    address: {
      line1: 'Teststraße 1',
      postalCode: '12345',
      city: 'Berlin',
      country: 'DE',
    },
    electronicAddress: {
      scheme: 'EM',
      value: 'kueck.marcel@gmail.com',
    },
    contact: {
      name: 'Marcel Kueck',
      email: 'kueck.marcel@gmail.com',
    },
  };

  const testInvoice: DocumentCreateRequest = {
    locale: 'de-DE',
    type: 'invoice',
    eInvoice: {
      type: 'zugferd',
      profile: 'basic',
    },
    number: 'RE-260107-K8Z0',
    issueDate: '2026-01-07',
    dueDate: '2026-01-21',
    buyerReference: 'ML260107-K8Z0',
    deliveryPeriod: {
      startDate: '2026-01-07',
      endDate: '2026-01-07',
    },
    sender,
    recipient,
    payment: {
      means: [
        {
          code: '30',
          bankAccount: {
            bankName: 'Test Bank',
            iban: 'DE89370400440532013000',
            bic: 'COBADEFFXXX',
          },
        },
      ],
      terms: 'Bereits bezahlt per Kreditkarte/Online-Zahlung',
    },
    preTableText: 'Vielen Dank für Ihre Bestellung!\n\nRechnungsnummer: RE-260107-K8Z0\nBestellnummer: ML260107-K8Z0',
    postTableText: 'Diese Rechnung wurde maschinell erstellt und ist ohne Unterschrift gültig.\n\nVielen Dank für Ihren Einkauf bei Marie Lou Coffee!',
    lines: [
      {
        unitPrice: {
          value: '14.90',
          currency: 'EUR',
        },
        item: {
          name: 'Yirgacheffe Natural - Whole Bean',
          description: '250g',
          vat: {
            code: 'S',
            rate: '19.00',
          },
        },
        quantity: {
          value: '1',
          unit: 'H87',
        },
      },
      {
        unitPrice: {
          value: '4.95',
          currency: 'EUR',
        },
        item: {
          name: 'Versand',
          description: 'Standardversand',
          vat: {
            code: 'S',
            rate: '19.00',
          },
        },
        quantity: {
          value: '1',
          unit: 'H87',
        },
      },
    ],
    theme: logo ? { logo } : undefined,
  };

  console.log('\n📤 Creating invoice...');
  
  try {
    const document = await client.createDocument(testInvoice);
    console.log('✅ Invoice created successfully!');
    console.log('   Document ID:', document.id);
    console.log('   Full response:', JSON.stringify(document, null, 2));

    // Now download the PDF
    console.log('\n📥 Downloading PDF...');
    
    const pdfBuffer = await client.readDocument(document.id, 'pdf');
    const outputPath = path.join(process.cwd(), 'test-invoice.pdf');
    await fs.writeFile(outputPath, Buffer.from(pdfBuffer));
    
    console.log('✅ PDF saved to:', outputPath);
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Use this Document ID to update the existing order:');
    console.log('   Document ID:', document.id);
    console.log('   Invoice Number: RE-260107-K8Z0');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCreateInvoice();

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../src/db/index';
import { orders } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const ORDER_ID = '7a08d8f7-1137-4b06-abe2-78bb63618cf7';
const INVOICE_ID = 'doc_01ked617e4e4d8mgwehw0mdcpv';
const INVOICE_NUMBER = 'RE-260107-K8Z0';

async function updateOrder() {
  const result = await db.update(orders)
    .set({
      invoiceId: INVOICE_ID,
      invoiceNumber: INVOICE_NUMBER,
      invoiceGeneratedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, ORDER_ID))
    .returning();
    
  console.log('Updated order:', result[0]?.orderNumber);
  console.log('Invoice ID:', result[0]?.invoiceId);
  console.log('Invoice Number:', result[0]?.invoiceNumber);
  process.exit(0);
}

updateOrder();

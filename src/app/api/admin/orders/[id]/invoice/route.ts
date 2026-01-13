import { NextResponse } from 'next/server';
import { generateInvoiceForOrder } from '@/lib/invoice';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await generateInvoiceForOrder(id);
    
    return NextResponse.json({ 
      success: true, 
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber 
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

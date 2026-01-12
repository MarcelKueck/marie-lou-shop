import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse, logCronStart, logCronComplete, logCronError } from '@/lib/cron-auth';
import { getLowStockProducts } from '@/lib/inventory';
import { sendAdminLowStockAlertEmail } from '@/lib/email';

const JOB_NAME = 'check-low-stock';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  logCronStart(JOB_NAME);

  try {
    // Check stock levels using the inventory system
    const lowStockProducts = await getLowStockProducts();

    if (lowStockProducts.length === 0) {
      logCronComplete(JOB_NAME, { lowStockCount: 0, emailSent: false });
      return NextResponse.json({
        success: true,
        lowStockCount: 0,
        message: 'All products have sufficient stock',
      });
    }

    // Format for email
    const formattedProducts = lowStockProducts.map(p => ({
      name: p.name,
      currentStock: p.currentStock,
      threshold: p.lowStockThreshold,
    }));

    // Send alert email
    const result = await sendAdminLowStockAlertEmail(formattedProducts);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    logCronComplete(JOB_NAME, { 
      lowStockCount: lowStockProducts.length, 
      emailSent: true,
      products: lowStockProducts.map(p => p.name),
    });

    return NextResponse.json({
      success: true,
      lowStockCount: lowStockProducts.length,
      products: lowStockProducts,
    });
  } catch (error) {
    logCronError(JOB_NAME, error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

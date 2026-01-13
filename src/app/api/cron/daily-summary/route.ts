import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse, logCronStart, logCronComplete, logCronError } from '@/lib/cron-auth';
import { db } from '@/db';
import { orders, customers } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';
import { sendAdminDailySummaryEmail } from '@/lib/email';

const JOB_NAME = 'daily-summary';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  logCronStart(JOB_NAME);

  try {
    // Calculate date range for yesterday (or today if running manually)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Convert to ISO strings for SQLite binding
    const yesterdayStr = yesterday.toISOString();
    const todayStr = today.toISOString();
    
    // Get orders from yesterday
    const yesterdayOrders = await db.select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${yesterdayStr} AND ${orders.createdAt} < ${todayStr}`);
    
    // Get new customers from yesterday
    const newCustomers = await db.select({
      count: sql<number>`count(*)`,
    })
    .from(customers)
    .where(sql`${customers.createdAt} >= ${yesterdayStr} AND ${customers.createdAt} < ${todayStr}`);
    
    // Get pending orders (paid but not processed)
    const pendingOrders = await db.select({
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(eq(orders.status, 'paid'));
    
    // Get processing orders (ready to ship)
    const processingOrders = await db.select({
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(eq(orders.status, 'processing'));
    
    const summary = {
      date: yesterday.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      ordersCount: Number(yesterdayOrders[0]?.count || 0),
      revenue: Number(yesterdayOrders[0]?.revenue || 0),
      newCustomers: Number(newCustomers[0]?.count || 0),
      pendingOrders: Number(pendingOrders[0]?.count || 0),
      processingOrders: Number(processingOrders[0]?.count || 0),
    };
    
    // Send the email
    const result = await sendAdminDailySummaryEmail(summary);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }
    
    logCronComplete(JOB_NAME, summary);
    
    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    logCronError(JOB_NAME, error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

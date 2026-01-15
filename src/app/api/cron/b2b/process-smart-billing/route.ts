import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies, b2bInvoices, B2B_SMART_RATES } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyCronRequest } from '@/lib/cron-auth';

/**
 * B2B Smart Billing Cron Job
 * Runs on the 1st of each month at 6 AM
 * Generates monthly invoices for Smart tier customers
 */
export async function GET(request: NextRequest) {
  // Verify cron authentication
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const billingPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
    const billingPeriodStart = new Date(billingPeriodEnd.getFullYear(), billingPeriodEnd.getMonth(), 1); // First day of previous month

    // Get all active Smart tier companies
    const smartCompanies = await db
      .select()
      .from(b2bCompanies)
      .where(
        and(
          eq(b2bCompanies.status, 'active'),
          // Smart tiers start with 'smart_'
        )
      );

    const smartTierCompanies = smartCompanies.filter(c => c.tier.startsWith('smart_'));

    const results = {
      processed: 0,
      invoicesCreated: 0,
      errors: [] as string[],
    };

    for (const company of smartTierCompanies) {
      try {
        // Calculate rate based on tier
        const tierKey = company.tier as keyof typeof B2B_SMART_RATES;
        const ratePerEmployee = company.monthlyRatePerEmployee || B2B_SMART_RATES[tierKey] || 1500;
        const employeeCount = company.employeeCount || 10;

        // Calculate amounts
        const baseAmount = employeeCount * ratePerEmployee;
        const taxRate = 0.19; // 19% German VAT
        const taxAmount = Math.round(baseAmount * taxRate);
        const total = baseAmount + taxAmount;

        // Generate invoice number
        const invoiceNumber = `B2B-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${company.id.slice(0, 6).toUpperCase()}`;

        // Check if invoice already exists for this period
        const existingInvoice = await db
          .select()
          .from(b2bInvoices)
          .where(
            and(
              eq(b2bInvoices.companyId, company.id),
              eq(b2bInvoices.invoiceNumber, invoiceNumber)
            )
          )
          .limit(1);

        if (existingInvoice.length > 0) {
          results.errors.push(`Invoice already exists for ${company.companyName}`);
          continue;
        }

        // Create invoice
        await db.insert(b2bInvoices).values({
          id: crypto.randomUUID(),
          companyId: company.id,
          invoiceNumber,
          billingPeriodStart,
          billingPeriodEnd,
          employeeCount,
          ratePerEmployee,
          baseAmount,
          extraShipmentsAmount: 0,
          subtotal: baseAmount,
          taxRate,
          taxAmount,
          total,
          currency: 'EUR',
          status: 'draft',
          createdAt: now,
          dueAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
        });

        results.invoicesCreated++;
        results.processed++;
      } catch (error) {
        results.errors.push(`Error processing ${company.companyName}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      billingPeriod: {
        start: billingPeriodStart.toISOString(),
        end: billingPeriodEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error('B2B Smart billing error:', error);
    return NextResponse.json(
      { error: 'Failed to process Smart billing' },
      { status: 500 }
    );
  }
}

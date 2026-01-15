import { NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentB2BCompany } from '@/lib/b2b-auth';
import { sendAdminB2BInquiryNotification } from '@/lib/b2b-email';

/**
 * B2B Upgrade Request API
 * POST /api/b2b/portal/upgrade
 * 
 * Submits an upgrade request from Flex to Smart tier
 */

interface UpgradeRequest {
  tier: string;
  employeeCount: number;
  message?: string;
}

export async function POST(request: Request) {
  try {
    // Get current company
    const company = await getCurrentB2BCompany();
    
    if (!company) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow active Flex companies to upgrade
    if (company.tier !== 'flex') {
      return NextResponse.json(
        { error: 'Only Flex tier companies can request an upgrade' },
        { status: 400 }
      );
    }
    
    if (company.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active companies can request an upgrade' },
        { status: 400 }
      );
    }
    
    const body = await request.json() as UpgradeRequest;
    
    // Validate tier
    const validTiers = ['smart_starter', 'smart_growth', 'smart_scale', 'smart_enterprise'];
    if (!validTiers.includes(body.tier)) {
      return NextResponse.json(
        { error: 'Invalid tier selected' },
        { status: 400 }
      );
    }
    
    // Validate employee count
    if (!body.employeeCount || body.employeeCount < 1 || body.employeeCount > 10000) {
      return NextResponse.json(
        { error: 'Invalid employee count' },
        { status: 400 }
      );
    }
    
    // Update company with upgrade request info
    const now = new Date();
    const existingNotes = company.internalNotes || '';
    const upgradeNote = `\n[${now.toISOString()}] UPGRADE REQUEST: ${body.tier} for ${body.employeeCount} employees`;
    
    await db
      .update(b2bCompanies)
      .set({
        internalNotes: existingNotes + upgradeNote,
        employeeCount: body.employeeCount,
        updatedAt: now,
      })
      .where(eq(b2bCompanies.id, company.id));
    
    // Send notification to admin
    await sendAdminB2BInquiryNotification({
      companyName: company.companyName,
      contactName: `${company.contactFirstName} ${company.contactLastName}`,
      email: company.contactEmail,
      tier: 'smart',
      locale: 'en',
    });
    
    return NextResponse.json({
      success: true,
      message: 'Upgrade request submitted successfully',
      requestedTier: body.tier,
      employeeCount: body.employeeCount,
    });
  } catch (error) {
    console.error('Upgrade request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit upgrade request' },
      { status: 500 }
    );
  }
}

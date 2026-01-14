import { NextRequest, NextResponse } from 'next/server';
import { requireB2BAuth } from '@/lib/b2b-auth';
import { db } from '@/db';
import { b2bCompanies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const company = await requireB2BAuth();
    
    if (!company) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Return company info (excluding sensitive fields)
    return NextResponse.json({
      company: {
        id: company.id,
        companyName: company.companyName,
        contactFirstName: company.contactFirstName,
        contactLastName: company.contactLastName,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        vatId: company.vatId,
        tier: company.tier,
        status: company.status,
        shippingLine1: company.shippingLine1,
        shippingLine2: company.shippingLine2,
        shippingCity: company.shippingCity,
        shippingPostalCode: company.shippingPostalCode,
        shippingCountry: company.shippingCountry,
        billingLine1: company.billingLine1,
        billingLine2: company.billingLine2,
        billingCity: company.billingCity,
        billingPostalCode: company.billingPostalCode,
        billingCountry: company.billingCountry,
        promoCode: company.promoCode,
        preferredBrand: company.preferredBrand,
      },
    });
    
  } catch (error) {
    console.error('Error fetching account info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account info' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const company = await requireB2BAuth();
    
    if (!company) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Update allowed fields only
    const allowedFields = {
      companyName: body.companyName,
      contactFirstName: body.contactFirstName,
      contactLastName: body.contactLastName,
      contactPhone: body.contactPhone,
      vatId: body.vatId,
      shippingLine1: body.shippingLine1,
      shippingLine2: body.shippingLine2,
      shippingCity: body.shippingCity,
      shippingPostalCode: body.shippingPostalCode,
      shippingCountry: body.shippingCountry,
      billingLine1: body.billingLine1,
      billingLine2: body.billingLine2,
      billingCity: body.billingCity,
      billingPostalCode: body.billingPostalCode,
      billingCountry: body.billingCountry,
      preferredBrand: body.preferredBrand,
      updatedAt: new Date(),
    };
    
    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(allowedFields).filter(([, v]) => v !== undefined)
    );
    
    await db
      .update(b2bCompanies)
      .set(updateData)
      .where(eq(b2bCompanies.id, company.id));
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

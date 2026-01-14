import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { b2bCompanies, b2bAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { companyId } = await params;
    
    // Get company
    const company = await db.query.b2bCompanies.findFirst({
      where: eq(b2bCompanies.id, companyId),
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.status === 'approved') {
      return NextResponse.json({ error: 'Company is already approved' }, { status: 400 });
    }

    // Generate a random password
    const tempPassword = randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Check if account already exists
    const existingAccount = await db.query.b2bAccounts.findFirst({
      where: eq(b2bAccounts.email, company.email),
    });

    if (!existingAccount) {
      // Create B2B account
      await db.insert(b2bAccounts).values({
        id: crypto.randomUUID(),
        companyId: company.id,
        email: company.email,
        passwordHash: hashedPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update company status
    const [updated] = await db.update(b2bCompanies)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(b2bCompanies.id, companyId))
      .returning();

    // TODO: Send welcome email with credentials
    // For now, just log the temp password (in real prod, this would be emailed)
    console.log(`[B2B Approval] Company ${company.companyName} approved. Temp password: ${tempPassword}`);

    return NextResponse.json({ 
      company: updated,
      message: 'Company approved successfully. Welcome email would be sent with credentials.',
      // Only include temp password in dev for testing
      ...(process.env.NODE_ENV === 'development' && { tempPassword }),
    });
  } catch (error) {
    console.error('Error approving B2B company:', error);
    return NextResponse.json({ error: 'Failed to approve company' }, { status: 500 });
  }
}

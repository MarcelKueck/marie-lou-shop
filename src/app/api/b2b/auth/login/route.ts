import { NextRequest, NextResponse } from 'next/server';
import { authenticateB2BCompany, createB2BSession } from '@/lib/b2b-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Authenticate the B2B company
    const authResult = await authenticateB2BCompany(email, password);
    
    if (!authResult.success || !authResult.company) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    const company = authResult.company;
    
    // Create a session (this also sets the cookie)
    const sessionToken = await createB2BSession(company.id);
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        companyName: company.companyName,
        contactName: `${company.contactFirstName} ${company.contactLastName}`,
        tier: company.tier,
        status: company.status,
      },
    });
    
  } catch (error) {
    console.error('B2B login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

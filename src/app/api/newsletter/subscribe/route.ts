import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { newsletters } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, brand = 'coffee', locale = 'en' } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await db
      .select()
      .from(newsletters)
      .where(eq(newsletters.email, email.toLowerCase()))
      .get();

    if (existing) {
      if (existing.status === 'active') {
        // Already subscribed and active
        return NextResponse.json(
          { message: 'Already subscribed', alreadySubscribed: true },
          { status: 200 }
        );
      } else {
        // Reactivate subscription
        await db
          .update(newsletters)
          .set({
            status: 'active',
            brand,
            subscribedAt: new Date(),
            unsubscribedAt: null,
          })
          .where(eq(newsletters.id, existing.id));
      }
    } else {
      // Create new subscription
      const id = `nl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await db.insert(newsletters).values({
        id,
        email: email.toLowerCase(),
        brand,
        status: 'active',
        subscribedAt: new Date(),
      });
    }

    // Send welcome email
    const brandName = brand === 'tea' ? 'Marie Lou Tea' : 'Marie Lou Coffee';
    const brandColor = brand === 'tea' ? '#3A5A40' : '#3D2B1F';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const welcomeContent = locale === 'de' 
      ? {
          subject: `Willkommen bei ${brandName}! ☕`,
          heading: 'Willkommen in der Familie!',
          message: `Vielen Dank für deine Anmeldung zum ${brandName} Newsletter. Du erhältst von uns exklusive Angebote, Neuigkeiten über frische Röstungen und Brühtipps.`,
          closing: 'Wir freuen uns, dich an Bord zu haben!',
          team: `Das ${brandName} Team`,
          unsubscribe: 'Abmelden',
        }
      : {
          subject: `Welcome to ${brandName}! ☕`,
          heading: 'Welcome to the Family!',
          message: `Thank you for subscribing to the ${brandName} newsletter. You'll receive exclusive offers, news about fresh roasts, and brewing tips straight to your inbox.`,
          closing: "We're excited to have you on board!",
          team: `The ${brandName} Team`,
          unsubscribe: 'Unsubscribe',
        };

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || `${brandName} <hello@marieloucoffee.com>`,
        to: email.toLowerCase(),
        subject: welcomeContent.subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF7F2;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
                      <!-- Header -->
                      <tr>
                        <td style="background: ${brandColor}; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                          <h1 style="color: #FAF7F2; margin: 0; font-size: 28px; font-weight: 500; font-family: Georgia, serif;">
                            ${brandName}
                          </h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="background: #FFFFFF; padding: 50px 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                          <h2 style="color: ${brandColor}; margin: 0 0 20px; font-size: 24px; font-weight: 500; font-family: Georgia, serif;">
                            ${welcomeContent.heading}
                          </h2>
                          
                          <p style="color: #6B5D4D; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
                            ${welcomeContent.message}
                          </p>
                          
                          <p style="color: #6B5D4D; font-size: 16px; line-height: 1.7; margin: 0 0 30px;">
                            ${welcomeContent.closing}
                          </p>
                          
                          <!-- CTA Button -->
                          <table role="presentation" style="margin: 0 auto 30px;">
                            <tr>
                              <td style="background: ${brandColor}; border-radius: 50px;">
                                <a href="${baseUrl}/${locale}/shop" style="display: inline-block; padding: 16px 32px; color: #FAF7F2; text-decoration: none; font-weight: 500; font-size: 16px;">
                                  ${locale === 'de' ? 'Jetzt stöbern' : 'Browse Our Collection'}
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="color: ${brandColor}; font-size: 16px; margin: 0; font-weight: 500;">
                            ${welcomeContent.team}
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 30px; text-align: center;">
                          <p style="color: #8B7355; font-size: 13px; margin: 0;">
                            <a href="${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}" style="color: #8B7355; text-decoration: underline;">
                              ${welcomeContent.unsubscribe}
                            </a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      // Log email error but don't fail the subscription
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json(
      { message: 'Successfully subscribed', success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

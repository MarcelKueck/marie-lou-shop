import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { newsletters } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return new NextResponse(generateUnsubscribePage('error', 'No email provided'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Find and update subscription
    const subscription = await db
      .select()
      .from(newsletters)
      .where(eq(newsletters.email, email.toLowerCase()))
      .get();

    if (!subscription) {
      return new NextResponse(generateUnsubscribePage('not-found', email), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (subscription.status === 'unsubscribed') {
      return new NextResponse(generateUnsubscribePage('already-unsubscribed', email), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Unsubscribe
    await db
      .update(newsletters)
      .set({
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletters.id, subscription.id));

    return new NextResponse(generateUnsubscribePage('success', email), {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new NextResponse(generateUnsubscribePage('error', 'An error occurred'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

function generateUnsubscribePage(status: 'success' | 'error' | 'not-found' | 'already-unsubscribed', _detail: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const messages = {
    success: {
      title: 'Unsubscribed Successfully',
      message: `You've been unsubscribed from our newsletter. We're sorry to see you go!`,
      icon: '✓',
    },
    error: {
      title: 'Something Went Wrong',
      message: `We couldn't process your request. Please try again or contact us.`,
      icon: '!',
    },
    'not-found': {
      title: 'Email Not Found',
      message: `We couldn't find a subscription for this email address.`,
      icon: '?',
    },
    'already-unsubscribed': {
      title: 'Already Unsubscribed',
      message: `This email is already unsubscribed from our newsletter.`,
      icon: '✓',
    },
  };

  const content = messages[status];

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.title} - Marie Lou</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'DM Sans', sans-serif;
            background: #FAF7F2;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            max-width: 500px;
            text-align: center;
            background: white;
            padding: 60px 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(61, 43, 31, 0.1);
          }
          .icon {
            width: 60px;
            height: 60px;
            background: ${status === 'success' || status === 'already-unsubscribed' ? '#3D2B1F' : '#C4A77D'};
            color: #FAF7F2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin: 0 auto 24px;
          }
          h1 {
            font-family: 'Playfair Display', serif;
            color: #3D2B1F;
            font-size: 28px;
            font-weight: 500;
            margin-bottom: 16px;
          }
          p {
            color: #6B5D4D;
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background: #3D2B1F;
            color: #FAF7F2;
            padding: 14px 32px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          .button:hover {
            background: #2b1d15;
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">${content.icon}</div>
          <h1>${content.title}</h1>
          <p>${content.message}</p>
          <a href="${baseUrl}" class="button">Visit Our Shop</a>
        </div>
      </body>
    </html>
  `;
}

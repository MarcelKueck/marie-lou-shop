✅ Already Tested
Admin Products Page - CRUD operations, image upload to Vercel Blob, visibility toggle
🧪 Remaining Tests
1. Shop & Product Display
<input disabled="" type="checkbox"> Visit /shop - verify products from database display correctly with uploaded images
<input disabled="" type="checkbox"> Click on a product to view detail page
<input disabled="" type="checkbox"> Verify inactive products don't appear on the shop page
2. Cart & Checkout
<input disabled="" type="checkbox"> Add products to cart
<input disabled="" type="checkbox"> View cart drawer
<input disabled="" type="checkbox"> Complete a checkout with Stripe (test mode)
<input disabled="" type="checkbox"> Verify order confirmation email is received
3. Customer Account
<input disabled="" type="checkbox"> Register a new account (/account)
<input disabled="" type="checkbox"> Login/logout
<input disabled="" type="checkbox"> Password reset flow (/auth/forgot-password)
<input disabled="" type="checkbox"> View order history in account
4. Gift Cards
<input disabled="" type="checkbox"> Purchase a gift card
<input disabled="" type="checkbox"> Apply gift card code at checkout
<input disabled="" type="checkbox"> Validate gift card balance
5. Referral Program
<input disabled="" type="checkbox"> Create/view referral code in account
<input disabled="" type="checkbox"> Apply referral code at checkout
<input disabled="" type="checkbox"> Verify referral rewards are tracked
6. Subscriptions
<input disabled="" type="checkbox"> Create a subscription for a product
<input disabled="" type="checkbox"> View/manage subscription in account
<input disabled="" type="checkbox"> Pause/cancel subscription
7. Reviews
<input disabled="" type="checkbox"> Submit a product review (after purchase)
<input disabled="" type="checkbox"> View reviews on product page
<input disabled="" type="checkbox"> Admin: approve/reject reviews
8. Admin Panel (beyond products)
<input disabled="" type="checkbox"> /admin - Dashboard overview
<input disabled="" type="checkbox"> /admin/orders - View and manage orders
<input disabled="" type="checkbox"> /admin/orders/[id] - Update order status (roasted, shipped, delivered)
<input disabled="" type="checkbox"> Generate invoice for an order
<input disabled="" type="checkbox"> Export orders
<input disabled="" type="checkbox"> View referrers
9. Cron Jobs (test manually with CRON_SECRET)
<input disabled="" type="checkbox"> GET /api/cron/daily-summary - Admin daily email
<input disabled="" type="checkbox"> GET /api/cron/send-review-requests - Review request emails
<input disabled="" type="checkbox"> GET /api/cron/check-low-stock - Low stock alerts
<input disabled="" type="checkbox"> GET /api/cron/cleanup-sessions - Session cleanup
<input disabled="" type="checkbox"> GET /api/cron/process-subscriptions - Auto-bill subscriptions
<input disabled="" type="checkbox"> GET /api/cron/subscription-reminders - Reminder emails
To test cron jobs locally:

10. Stripe Webhooks
<input disabled="" type="checkbox"> Run stripe listen --forward-to http://localhost:3000/api/webhook/stripe
<input disabled="" type="checkbox"> Complete a test purchase and verify webhook processes correctly
11. Email System
<input disabled="" type="checkbox"> Order confirmation email
<input disabled="" type="checkbox"> Shipping notification email
<input disabled="" type="checkbox"> Password reset email
<input disabled="" type="checkbox"> Review request email
<input disabled="" type="checkbox"> Subscription reminder email
Environment Variables to Verify
Make sure these are set in .env.local:

BLOB_READ_WRITE_TOKEN - Vercel Blob
RESEND_API_KEY - Email sending
STRIPE_SECRET_KEY & STRIPE_WEBHOOK_SECRET - Payments
CRON_SECRET - Cron job authentication
ADMIN_EMAIL & ADMIN_PASSWORD - Admin login
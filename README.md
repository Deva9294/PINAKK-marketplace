# PINAKK Marketplace

Next.js 16 + React 19 + TypeScript + MongoDB storefront for PINAKK, Rehti, Madhya Pradesh.

## Current modules
- Responsive storefront with product search, category filters and cart UI
- MongoDB-backed product catalogue and admin product CRUD
- Customer registration/login with scrypt password hashing and signed HTTP-only session cookies
- Customer orders API with server-side product/price lookup and atomic stock reservation
- Admin order/customer/delivery staff APIs and delivery personnel dashboard
- Health/readiness endpoints and Render Blueprint configuration
- Razorpay server-side order creation, signature verification and signed webhook processing (configure credentials before enabling)

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000. Configure MongoDB and admin credentials before using database-backed features.

## Required environment variables
- `MONGODB_URI`: MongoDB connection string.
- `PINAKK_ADMIN_EMAIL`: administrator email address.
- `PINAKK_ADMIN_PASSWORD`: unique, strong administrator password. Never commit it.
- `AUTH_SECRET`: random secret with at least 32 bytes.

## Optional Razorpay environment variables
Set all four values in Render before offering Razorpay checkout:
- `RAZORPAY_KEY_ID`: Razorpay API key ID (server-side).
- `RAZORPAY_KEY_SECRET`: Razorpay API key secret (server-side only).
- `RAZORPAY_WEBHOOK_SECRET`: secret configured for the Razorpay webhook.
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: public key ID used by the browser checkout widget.

Configure a Razorpay webhook pointing to `/api/payments/webhook` and subscribe to `payment.captured`, `payment.failed` and `order.paid`. The webhook secret must exactly match the Render environment variable. Never expose or commit the API secret or webhook secret.

## Render deployment
1. Select this repository in Render as a Blueprint, or create a Node web service.
2. Build command: `npm install && npm run build`.
3. Start command: `npm start`.
4. Health check: `/api/health`.
5. Set the required MongoDB and admin environment variables. Render Blueprint generates `AUTH_SECRET`; verify it exists and is at least 32 bytes.
6. Add Razorpay variables only after the merchant account and webhook are configured.

## Important production limitations
This repository is an evolving marketplace implementation, not yet a fully audited enterprise launch. The current checkout/order API supports server-side product price lookup and stock reservation, but complete shipping/tax/coupon calculation, refunds/returns, invoice generation, delivery OTP, customer password-reset email delivery, Cloudinary uploads, transactional notifications and full automated end-to-end tests still require implementation. Do not accept live orders until those workflows, legal pages, stock data, payment reconciliation, backups and monitoring have been tested in the deployed environment.

Demo catalogue entries, photos, prices and stock are not verified inventory. Replace them with actual product data before launch. Use a strong unique admin password and rotate credentials if staff access changes.

Store phone: 9685535343. Confirm the public support email before launch.

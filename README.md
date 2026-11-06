# PINAKK Marketplace

Next.js 16 + React 19 + TypeScript + MongoDB storefront for PINAKK, Rehti, Madhya Pradesh.

## Current modules

- Responsive storefront with product search, category filters and cart UI
- MongoDB-backed product catalogue and admin product CRUD
- Customer registration/login with scrypt password hashing and signed HTTP-only session cookies
- Customer orders API with server-side product/price lookup and atomic stock reservation
- Admin order/customer/delivery staff APIs and delivery personnel dashboard
- Health/readiness endpoint that verifies required security configuration and MongoDB connectivity
- Render Blueprint configuration
- Razorpay server-side order creation, signature verification and signed webhook processing (configure credentials before enabling)
- GST invoices, shipping zones, coupons, stock history and delivery tracking are present in the repository history; verify each workflow against a configured production-like database before launch

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Configure MongoDB and admin credentials before using database-backed features.

## Required environment variables

- `MONGODB_URI`: MongoDB connection string. Use a MongoDB replica set / Atlas deployment for multi-document transactions.
- `PINAKK_ADMIN_EMAIL`: administrator email address.
- `PINAKK_ADMIN_PASSWORD`: unique, strong administrator password. Never commit it.
- `AUTH_SECRET`: random secret with at least 32 bytes.

The readiness endpoint `/api/health` returns HTTP 200 only when the required admin/security configuration is present and MongoDB can be reached. It returns HTTP 503 when the service is not ready. It does not expose secret values or raw database errors.

## Optional Razorpay environment variables

Online checkout is disabled by default. Keep `PINAKK_ONLINE_PAYMENTS_ENABLED=false` for COD / pay-at-store only. The payment creation and verification APIs return HTTP 403 unless this flag is explicitly set to `true`. Only enable after successful Razorpay test-mode and webhook verification.

Set all four Razorpay values in Render before offering online checkout:

- `RAZORPAY_KEY_ID`: Razorpay API key ID (server-side).
- `RAZORPAY_KEY_SECRET`: Razorpay API key secret (server-side only).
- `RAZORPAY_WEBHOOK_SECRET`: secret configured for the Razorpay webhook.
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: public key ID used by the browser checkout widget.

Configure a Razorpay webhook pointing to `/api/payments/webhook` and subscribe to the payment events supported by the deployed webhook handler. The webhook secret must exactly match the Render environment variable. Never expose or commit the API secret or webhook secret. Test with Razorpay test credentials before enabling live payments.

## Render deployment

1. Select this repository in Render as a Blueprint, or create a Node web service.
2. Build command: `npm install && npm run build`.
3. Start command: `npm start`.
4. Health check: `/api/health`.
5. Set `MONGODB_URI`, `PINAKK_ADMIN_EMAIL`, and `PINAKK_ADMIN_PASSWORD`. The Blueprint generates `AUTH_SECRET`; verify it is present and at least 32 bytes.
6. Add all four Razorpay variables only after the merchant account and webhook are configured.
7. Confirm Render's deployed commit SHA matches the intended `main` commit after deployment.

## Production launch checklist

- [ ] Replace demo catalogue entries, photos, prices and stock with verified inventory.
- [ ] Test customer registration, login, session expiry and account recovery.
- [ ] Test admin creation of delivery staff and delivery login/authorization.
- [ ] Test checkout totals, shipping, coupons, GST and invoice PDFs against expected cases.
- [ ] Test stock reservation, failed payment, cancellation and stock restoration.
- [ ] Test Razorpay order creation, signature verification, webhook retries, duplicate events and reconciliation in test mode.
- [ ] Test refund authorization and refund webhooks in test mode before enabling live refunds.
- [ ] Test delivery assignment, GPS permission handling and tracking on real mobile devices.
- [ ] Configure email/SMS delivery, image storage, backups, log retention and uptime alerting before depending on them.
- [ ] Publish accurate shipping, returns/refunds, privacy, terms and contact policies.
- [ ] Verify production HTTP response, page rendering, database readiness and deployed commit SHA.

A successful build or HTTP response alone does not prove every customer, admin, payment or delivery workflow works. Do not accept live orders until the relevant production-like and live-mode checks have passed.

Store phone: 9685535343. Confirm the public support email before launch.

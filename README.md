# PINAKK Marketplace

Next.js storefront starter for **Ashish Stationery & Photocopy**, Main Road, Rehti, Madhya Pradesh.

## Stack
- Next.js 14 App Router + TypeScript
- Responsive storefront, category filters, product search
- Browser-persisted demo cart
- WhatsApp order enquiry handoff
- Store dashboard preview
- Health endpoint: `/api/health`

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Deployment
Deploy as a Next.js application on Render or Vercel. Build command: `npm run build`; start command: `npm start`.

## Important production work still required
This repository starts the storefront experience. It is **not yet a production-ready commerce backend**. Before taking online orders/payments, implement and test:
1. MongoDB models and persistent product, stock, customer, cart and order data.
2. Secure customer authentication and role-based admin/delivery access.
3. Admin CRUD, inventory and order fulfilment workflows.
4. Razorpay server-side order creation, signature verification, webhook reconciliation and refunds.
5. Delivery zones, shipping fees, taxes, invoices and order notifications.
6. Image upload/storage, input validation, rate limiting, audit logs, privacy policy and terms.
7. Automated tests and deployment environment configuration.

The cart currently uses browser localStorage and the checkout hands an order enquiry to WhatsApp. No online payment is collected by this starter.
Store phone: 9685535343. Contact email placeholder: hello@pinakk.online (verify/configure before use).

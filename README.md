# PINAKK Marketplace

Next.js 14 App Router + TypeScript storefront for **Ashish Stationery & Photocopy**, Main Road, Rehti, Madhya Pradesh.

## Included
- Responsive storefront with search and category filters
- MongoDB-backed active product catalogue with demo fallback
- Browser-local cart
- WhatsApp order enquiry handoff (no online payment)
- MongoDB connection helper and Product model
- Product API: public active-product listing; API-key-protected create/update
- Health endpoint: `/api/health`

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000.

## Environment variables
Set these in your local `.env.local` and in the hosting provider's private environment settings:
- `MONGODB_URI`: MongoDB connection string for the PINAKK database.
- `PINAKK_ADMIN_API_KEY`: long, random server-only secret used by the current product write API. Never prefix it with `NEXT_PUBLIC_`, commit it, or expose it in browser code.

Generate a strong key, for example with `openssl rand -hex 32`. Rotate it immediately if it is ever exposed. Use a database user restricted to the required database and enable network access only for trusted sources where practical.

## Product API
- `GET /api/products`: lists active products from MongoDB.
- `POST /api/products`: creates a product; requires `x-admin-api-key`.
- `PATCH /api/products/:id`: updates product fields; requires `x-admin-api-key`.
- Write requests validate fields and return generic errors. Do not call the write endpoints directly from public browser code or embed the admin key in a client bundle.

Example create request (run from a trusted server/terminal, not a public webpage):
```bash
curl -X POST http://localhost:3000/api/products \
  -H "content-type: application/json" \
  -H "x-admin-api-key: $PINAKK_ADMIN_API_KEY" \
  -d '{"name":"A4 Copier Paper","slug":"a4-copier-paper","category":"Paper & Printing","description":"500-sheet pack","price":285,"stock":20}'
```

## Deployment
Deploy as a Next.js application on Render or Vercel. Build command: `npm run build`; start command: `npm start`. Configure the two environment variables above in the hosting dashboard before using the product API.

## Important limitations — not production-ready yet
The storefront and cart now request the active catalogue from the MongoDB product API and fall back to sample products when the database is unavailable or empty. The cart remains in browser localStorage. The admin page is still only a preview; the API key is a basic server-to-server guard, **not** customer/admin login or a full role-based access system.

Before live sales, still implement and test:
1. Connect the storefront and admin UI to the database API.
2. Secure customer, admin and delivery authentication with sessions and role-based permissions.
3. Persistent carts, orders, stock reservation and order fulfilment workflows.
4. Razorpay server-side order creation, signature verification, webhook reconciliation and refunds.
5. Delivery zones, shipping fees, taxes, invoices and order notifications.
6. Image upload/storage, rate limiting, audit logs, privacy policy and terms.
7. Automated tests, dependency/security review and deployment verification.

No online payment is collected by this starter. Sample products, prices, images and stock are demonstration data only; verify them before publication.

Store phone: 9685535343. Contact email must be configured and verified before publication.

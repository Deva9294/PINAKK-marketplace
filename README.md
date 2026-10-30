# PINAKK Marketplace

Next.js 15 + React 19 + TypeScript storefront for **Ashish Stationery & Photocopy**, Main Road, Rehti, Madhya Pradesh.

## Implemented
- Responsive storefront with search, category filters and cart
- MongoDB-backed product catalogue with demo-catalogue fallback
- Secure admin login at `/admin` using signed JWT in an HTTP-only, Secure (production), SameSite=Strict cookie
- Admin product management: add, edit, publish and hide products
- Server-side authorization on product write endpoints
- Product API validation and duplicate-slug handling
- Render Blueprint at `render.yaml`
- Health endpoint at `/api/health`

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000. Configure MongoDB and admin environment variables before using admin functions.

## Required environment variables
- `MONGODB_URI`: MongoDB connection string for the PINAKK database.
- `PINAKK_ADMIN_EMAIL`: administrator email address.
- `PINAKK_ADMIN_PASSWORD`: unique, strong administrator password. Never commit it.
- `AUTH_SECRET`: random secret with at least 32 bytes, used to sign admin sessions.

Generate an auth secret with `openssl rand -base64 48`. Use a long unique admin password and keep all values in Render's private environment settings. Never use a `NEXT_PUBLIC_` prefix for secrets. If any secret is exposed, rotate it immediately.

## Render deployment
1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and select this repository. Render reads `render.yaml`.
3. Enter the four required environment values when Render prompts you. Use a MongoDB database and allow only the necessary network access from your hosting service.
4. Deploy. Render runs `npm install && npm run build` and starts the app with `npm start`.
5. When deployment succeeds, open `/admin` and sign in with the configured admin email/password.
6. Check `/api/health` and verify the storefront, admin login and product CRUD before sharing the site.

You can also create a Render Web Service manually with runtime **Node**, build command `npm install && npm run build`, start command `npm start`, and health check path `/api/health`.

## Product API
- `GET /api/products`: public active products; an authenticated admin may add `?all=1` to see hidden products too.
- `POST /api/products`: create product; requires a valid admin session cookie.
- `PATCH /api/products/:id`: update product; requires a valid admin session cookie.
- `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/session`: admin session endpoints.

The admin password and signing secret are checked only on the server. Product write APIs do not accept a browser-supplied API key.

## Not enabled yet — do not accept live paid orders
The cart currently remains in browser localStorage and the checkout hands the enquiry to WhatsApp. This repository does **not** yet include persistent customer accounts, order records, Razorpay payment creation/verification/webhooks/refunds, shipping/tax calculation, delivery workflow, invoice generation or transactional notifications. Razorpay cannot be enabled until merchant keys and webhook configuration are supplied and the complete payment flow is implemented and tested. Sample products, prices, images and stock are demonstration data; replace them with verified store inventory before launch.

For production launch, also configure privacy policy, terms/returns, shipping rules, customer support details, database backups, rate limiting and monitoring. The admin login currently uses environment-based credentials; use a unique password and rotate it if staff access changes.

Store phone: 9685535343. Confirm the public contact email before launch.

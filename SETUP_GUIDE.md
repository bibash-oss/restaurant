# Complete MVP Setup & Configuration Guide
## QR Code Restaurant Table Ordering & Payment System

> **Goal:** Run the application end-to-end locally and complete this entire flow:  
> **Create restaurant → Create table → Generate QR → Add menu items → Scan QR → Order food → Pay with Stripe Test Mode → Receive confirmed order in Kitchen/Admin Dashboard.**

---

## Table of Contents
1. [Local Development](#1-local-development)
2. [Supabase Setup (PostgreSQL, Auth & Storage)](#2-supabase-setup)
3. [Stripe Setup (Checkout & Webhooks)](#3-stripe-setup)
4. [QR Code Setup & Mobile Phone Testing](#4-qr-code-setup)
5. [Environment Variables Reference](#5-environment-variables)
6. [Production Deployment Guide](#6-production-deployment)
7. [End-to-End Testing Checklist](#7-end-to-end-testing-checklist)
8. [Troubleshooting & Common Pitfalls](#8-troubleshooting)
9. [Architecture Deep Dive](#9-architecture-explanation)

---

## 1. Local Development

### 1.1 Prerequisites & Versions
* **Node.js**: Version `20.x` or `22.x` (LTS recommended, minimum `v18.18.0`). Check with:
  ```bash
  node -v
  ```
* **npm**: Version `10.x` or higher (or `pnpm 9+` / `yarn 1.22+`). Check with:
  ```bash
  npm -v
  ```
* **Stripe CLI**: (Optional but strongly recommended for forwarding webhooks locally). Install via:
  * **macOS (Homebrew)**: `brew install stripe/stripe-cli/stripe`
  * **Windows (Scoop)**: `scoop bucket add stripe https://github.com/stripe/stripe-cli.git && scoop install stripe`
  * **Linux**: `sudo apt-get install stripe` or download binary from [Stripe CLI Releases](https://github.com/stripe/stripe-cli/releases).

### 1.2 Installation
In the project root directory, install all required dependencies:
```bash
npm install
```

### 1.3 Running the Development Server
Start the local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

* **Landing Page**: [http://localhost:3000](http://localhost:3000)
* **Restaurant Admin Console**: [http://localhost:3000/admin](http://localhost:3000/admin)
* **Live Kitchen Orders Board**: [http://localhost:3000/admin/orders](http://localhost:3000/admin/orders)
* **Tables & QR Generator**: [http://localhost:3000/admin/tables](http://localhost:3000/admin/tables)
* **Demo Customer Menu (Table 5)**: [http://localhost:3000/restaurant/golden-olive/table/table-5-golden](http://localhost:3000/restaurant/golden-olive/table/table-5-golden)

### 1.4 Initial Configuration Files
Copy the provided `.env.example` into `.env.local`:
```bash
cp .env.example .env.local
```

---

## 2. Supabase Setup

Supabase provides the PostgreSQL database, Row-Level Security (RLS), real-time order streams, and user authentication.

### Step 2.1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and click **Sign Up** or **Sign In**.
2. Click **New Project**.
3. Fill in:
   * **Name**: `Restaurant QR MVP` (or any preferred name).
   * **Database Password**: Choose a strong password and save it securely.
   * **Region**: Select the region geographically closest to you or your target restaurant.
   * **Pricing Plan**: Select **Free tier**.
4. Click **Create new project** and wait ~1-2 minutes for provisioning.

### Step 2.2: Retrieve Connection Details & Keys
Navigate to **Project Settings** (gear icon on bottom left) $\rightarrow$ **API**:
1. **Project URL**: Copy this value. This is your `NEXT_PUBLIC_SUPABASE_URL`.
   * Example: `https://xyzprojectref.supabase.co`
2. **Project API Keys**:
   * Copy the **`anon` `public`** key. This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   * Click **Reveal** on the **`service_role` `secret`** key and copy it. This is your `SUPABASE_SERVICE_ROLE_KEY`.

> [!CAUTION]
> **CRITICAL SECURITY RULE:**
> * `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public and embedded into client browser bundles. It respects Row Level Security (RLS).
> * `SUPABASE_SERVICE_ROLE_KEY` is completely secret. It **bypasses all Row Level Security**. It must **NEVER** be prefixed with `NEXT_PUBLIC_` and must **NEVER** be used inside browser client components. In this project, it is used strictly inside `/api/checkout` and `/api/webhooks/stripe` on the server.

### Step 2.3: Run the Database Migrations (Schema & RLS)
1. In the Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open the file [`supabase/migrations/01_schema.sql`](file:///Users/bibashshrestha/Desktop/Ktmbees/mvp/restaurant/supabase/migrations/01_schema.sql) from this project.
4. Copy the entire contents and paste them into the Supabase SQL editor.
5. Click **Run** (green button).
   * This creates all 6 core tables: `restaurants`, `tables`, `categories`, `menu_items`, `orders`, and `order_items`.
   * It also automatically enables Row-Level Security (RLS) policies and automatic `updated_at` timestamps.

### Step 2.4: Seed the Sample Restaurant, Tables & Menu
1. In the Supabase **SQL Editor**, click **New Query**.
2. Open [`supabase/seed.sql`](file:///Users/bibashshrestha/Desktop/Ktmbees/mvp/restaurant/supabase/seed.sql).
3. Copy its contents and paste them into the editor.
4. Click **Run**.
   * This seeds "The Golden Olive Bistro" (`slug: golden-olive`), 5 dining tables with pre-computed QR tokens (including `table-5-golden`), 4 categories, and 8 dishes with prices in cents (e.g. `$14.99` $\rightarrow$ `1499`).

### Step 2.5: Configure Supabase Storage (Menu Dish Photos)
1. Go to **Storage** in the left navigation.
2. Click **New Bucket**.
3. Name: `menu-images`.
4. Toggle **Public bucket** to **ON** (so food photos can be rendered by customer phones).
5. Click **Save bucket**.
6. When adding custom menu items in the Admin panel, you can either:
   * Paste an external image URL (e.g. Unsplash, CDN).
   * Upload an image file directly into the `menu-images` bucket and use its public URL.

---

## 3. Stripe Setup

Stripe handles card payments, Apple Pay, and Google Pay with zero PCI compliance burden on your servers.

### Step 3.1: Create a Stripe Account & Enable Test Mode
1. Register or log in at [stripe.com](https://stripe.com).
2. Look at the top-right header and ensure the toggle switch is set to **Test Mode** (it should show an orange/yellow badge: `TEST MODE`).
   * Never use live keys during development.

### Step 3.2: Retrieve Stripe API Keys
1. Go to **Developers** $\rightarrow$ **API keys** ([dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)).
2. **Publishable key**: Copy `pk_test_...`.
   * Set `STRIPE_PUBLISHABLE_KEY=pk_test_...`
3. **Secret key**: Click **Reveal test key** and copy `sk_test_...`.
   * Set `STRIPE_SECRET_KEY=sk_test_...` (Keep private! Server only).

### Step 3.3: Set Up Stripe Webhooks for Local Development
The Stripe Webhook is how your application knows a customer completed their payment on Stripe Checkout.

#### Option A: Using the Stripe CLI (Recommended & Fastest)
1. Log in to the Stripe CLI:
   ```bash
   stripe login
   ```
   (Press Enter and authorize in the browser window).
2. Forward Stripe webhook events directly to your local Next.js server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. The CLI output will display your unique local webhook signing secret:
   ```text
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxx (^C to quit)
   ```
4. Copy that string (`whsec_...`) and set it in your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Keep that terminal window open while testing.

#### Option B: Triggering a Test Event via CLI
In a second terminal, you can verify your webhook endpoint at any time with:
```bash
stripe trigger checkout.session.completed
```

### Step 3.4: How Payment Status Changes from `PENDING` to `PAID`
1. Customer reviews their cart and clicks **Pay with Stripe**.
2. The browser sends a POST request to `/api/checkout`.
3. **Crucial Security Check**:
   * The server reads the item IDs from the cart payload.
   * It queries Supabase `menu_items` for the actual prices.
   * **The browser is never allowed to specify item prices or the total amount.**
4. The server creates an order in Supabase with `status = 'PENDING'` and creates a Stripe Checkout Session with `metadata: { order_id: "<order-uuid>" }`.
5. The customer completes payment with Stripe test cards (e.g. `4242 4242 4242 4242`).
6. Stripe immediately dispatches the `checkout.session.completed` webhook to `/api/webhooks/stripe`.
7. The webhook endpoint verifies the cryptographic signature with `STRIPE_WEBHOOK_SECRET`.
8. The webhook handler retrieves the `order_id` from metadata and updates the order status to `'PAID'` in Supabase.
9. Both the customer's Live Order Tracker (`/restaurant/[slug]/order-status/[orderId]`) and the kitchen display (`/admin/orders`) automatically detect the `'PAID'` state.

---

## 4. QR Code Setup

### 4.1 URL Structure
Every dining table has a unique cryptographic `qr_token`. The URL encoded inside the QR code follows this format:
```text
https://{APP_URL}/restaurant/{restaurantSlug}/table/{qrToken}
```
**Example:**
* Restaurant: `The Golden Olive Bistro` (`slug: golden-olive`)
* Table: `Table 5` (`qr_token: table-5-golden`)
* Local URL: `http://localhost:3000/restaurant/golden-olive/table/table-5-golden`
* Production URL: `https://dining.yourrestaurant.com/restaurant/golden-olive/table/table-5-golden`

### 4.2 Generating and Printing Table Cards
1. Open the Admin Console: [http://localhost:3000/admin/tables](http://localhost:3000/admin/tables).
2. You will see all configured tables.
3. Click **View / Print QR** on any table.
4. An interactive modal displays:
   * **Print Card**: Formats a clean 4"x6" table tent card designed for acrylic stands.
   * **Download PNG**: High-resolution 400x400 PNG with quiet zones for clear scanning.
   * **Copy URL**: Copies the exact scan link to test in mobile or desktop browsers.

### 4.3 Testing QR Scanning from a Physical Smartphone on Local Wi-Fi
To scan the QR code with your physical iPhone or Android camera during local development:

1. **Find your local computer IP address**:
   * macOS: In terminal, run `ipconfig getifaddr en0` (e.g., `192.168.1.50`).
   * Windows: In PowerShell, run `ipconfig` (look for IPv4 Address).
2. **Start Next.js listening on all network interfaces**:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
3. **Update `.env.local`**:
   ```env
   NEXT_PUBLIC_APP_URL=http://192.168.1.50:3000
   ```
4. Ensure your smartphone is connected to the **same Wi-Fi network**.
5. Open [http://192.168.1.50:3000/admin/tables](http://192.168.1.50:3000/admin/tables) on your computer, click **View / Print QR**, and point your smartphone's camera at the screen!

---

## 5. Environment Variables

Create `.env.local` in your project root with the following keys:

```env
# ------------------------------------------------------------------------------
# 1. SUPABASE CLIENT-SIDE (Safe to expose to browser)
# ------------------------------------------------------------------------------
# Source: Supabase Dashboard -> Project Settings -> API -> Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Source: Supabase Dashboard -> Project Settings -> API -> Project API Keys -> "anon" "public"
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ------------------------------------------------------------------------------
# 2. SUPABASE SERVER-SIDE (Private - NEVER expose to browser)
# ------------------------------------------------------------------------------
# Source: Supabase Dashboard -> Project Settings -> API -> Project API Keys -> "service_role" "secret"
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ------------------------------------------------------------------------------
# 3. STRIPE PAYMENTS (Test Mode)
# ------------------------------------------------------------------------------
# Source: Stripe Dashboard -> Developers -> API keys -> Publishable key
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Source: Stripe Dashboard -> Developers -> API keys -> Secret key (Private - Server only)
STRIPE_SECRET_KEY=sk_test_...

# Source: Stripe CLI `stripe listen` output (Private - Server only)
STRIPE_WEBHOOK_SECRET=whsec_...

# ------------------------------------------------------------------------------
# 4. APPLICATION HOST URL
# ------------------------------------------------------------------------------
# Used for QR generation and Stripe redirect URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Safe vs. Private Variable Audit

| Variable Name | Client or Server? | Safe in Browser? | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Both | **YES** | Public API endpoint for your Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both | **YES** | Public anonymous API key guarded by Postgres RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | **NO (STRICT)** | Secret master key. Bypasses RLS. Never use in client components. |
| `STRIPE_PUBLISHABLE_KEY` | Both | **YES** | Stripe public identifier. |
| `STRIPE_SECRET_KEY` | Server Only | **NO (STRICT)** | Secret API key used to initiate checkout sessions. |
| `STRIPE_WEBHOOK_SECRET` | Server Only | **NO (STRICT)** | Cryptographic secret used to verify Stripe webhook signatures. |
| `NEXT_PUBLIC_APP_URL` | Both | **YES** | Root origin for links and QR redirects. |

---

## 6. Production Deployment Guide

We recommend a simple, low-cost/free MVP stack:
* **Frontend / Server**: **Vercel** (Hobby Plan - Free)
* **Database & Auth**: **Supabase** (Free Tier)
* **Payment Processor**: **Stripe** (Pay-as-you-go per transaction)

### Step 6.1: Deploy Next.js to Vercel
1. Push your repository to GitHub / GitLab.
2. Go to [vercel.com](https://vercel.com) and click **Add New** $\rightarrow$ **Project**.
3. Import your restaurant repository.
4. In the **Environment Variables** section, paste all values from `.env.local`:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`
   * `STRIPE_PUBLISHABLE_KEY`
   * `STRIPE_SECRET_KEY`
   * `STRIPE_WEBHOOK_SECRET` (We will generate this in Step 6.2)
   * `NEXT_PUBLIC_APP_URL`: set to your production domain (e.g. `https://your-restaurant-app.vercel.app`).
5. Click **Deploy**.

### Step 6.2: Configure Production Stripe Webhook
1. Go to the **Stripe Dashboard** (switch to **Live Mode** or remain in **Test Mode** for staging).
2. Navigate to **Developers** $\rightarrow$ **Webhooks** ([dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)).
3. Click **Add destination** / **Add an endpoint**.
4. **Endpoint URL**: `https://your-restaurant-app.vercel.app/api/webhooks/stripe`
5. Click **+ Select events** and check:
   * `checkout.session.completed`
6. Click **Add endpoint**.
7. In the webhook overview, locate **Signing secret** $\rightarrow$ click **Reveal**.
8. Copy the secret (`whsec_...`).
9. In your **Vercel Project Settings** $\rightarrow$ **Environment Variables**, update `STRIPE_WEBHOOK_SECRET` with this live secret and redeploy.

---

## 7. End-to-End Testing Checklist

Use this checklist to verify your setup before opening to real diners:

- [ ] Supabase project created on free tier
- [ ] Database migrated with `01_schema.sql` (all 6 tables present in Table Editor)
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Seed script executed (`seed.sql`)
- [ ] Restaurant created (`The Golden Olive Bistro`, `slug: golden-olive`)
- [ ] Tables created (`Table 1` through `Table 5` with QR tokens)
- [ ] Menu categories created (Appetizers, Mains, Drinks, Desserts)
- [ ] Menu items created with prices stored in cents (`price: 1499` for `$14.99`)
- [ ] Stripe account created with Test Mode enabled
- [ ] Stripe publishable and secret keys copied into `.env.local`
- [ ] Stripe CLI running (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- [ ] `STRIPE_WEBHOOK_SECRET` updated with the `whsec_...` value from Stripe CLI
- [ ] Dev server started (`npm run dev`)
- [ ] Visit Admin tables page (`/admin/tables`) and inspect Table 5 QR code
- [ ] Customer scans Table 5 QR or visits `/restaurant/golden-olive/table/table-5-golden`
- [ ] Customer sees correct restaurant name and "Table 5" indicator badge
- [ ] Customer adds items to cart (e.g. 1x Truffle Funghi Pizza, 1x Blood Orange Spritz)
- [ ] Cart drawer displays correct subtotal
- [ ] Customer enters optional note ("Extra napkins") and clicks **Pay with Stripe**
- [ ] Server validates prices against database and redirects to Stripe Checkout
- [ ] Complete payment using Stripe Test Card: `4242 4242 4242 4242`, Exp: any future date, CVC: `123`, ZIP: `90210`
- [ ] Redirected to Live Order Tracker (`/order-status/[orderId]`)
- [ ] Stripe CLI terminal shows `200 OK` on `POST /api/webhooks/stripe`
- [ ] Order status changes from `PENDING` to `PAID`
- [ ] Live Kitchen Orders Board (`/admin/orders`) shows the new paid ticket
- [ ] Kitchen staff clicks **Send to Kitchen** $\rightarrow$ order status becomes `PREPARING`
- [ ] Kitchen staff clicks **Mark Ready** $\rightarrow$ order status becomes `READY`
- [ ] Customer's phone updates live through all stages!

---

## 8. Troubleshooting

### 1. Supabase Connection & Schema Errors
* **Symptom**: `relation "public.restaurants" does not exist` or `permission denied for schema public`.
* **Fix**: You must run [`supabase/migrations/01_schema.sql`](file:///Users/bibashshrestha/Desktop/Ktmbees/mvp/restaurant/supabase/migrations/01_schema.sql) in the Supabase SQL Editor. Also ensure you ran the script in the `public` schema.

### 2. RLS Permission Errors (`new row violates row-level security policy`)
* **Symptom**: Cart checkout fails with a 500 error mentioning RLS.
* **Fix**: Make sure `SUPABASE_SERVICE_ROLE_KEY` is provided in `.env.local`. The `/api/checkout` and `/api/webhooks/stripe` routes use the service role key (`supabaseAdmin`) to bypass RLS when writing orders and updating statuses.

### 3. Payment Succeeds on Stripe, But Order Remains `PENDING`
* **Symptom**: Customer card was charged in test mode, but the order tracker stays on `PENDING` and never flips to `PAID`.
* **Fix**:
  1. Check your Stripe CLI terminal. Did you start `stripe listen --forward-to localhost:3000/api/webhooks/stripe`?
  2. Does your `STRIPE_WEBHOOK_SECRET` in `.env.local` exactly match the `whsec_...` printed by `stripe listen`?
  3. Every time you restart `stripe listen`, Stripe generates a **new** webhook secret. Ensure `.env.local` is updated and the Next.js dev server restarted.

### 4. Stripe Webhook Signature Verification Failed
* **Symptom**: Webhook terminal shows `400 Invalid webhook signature`.
* **Fix**: In Next.js App Router, the webhook payload must be read as raw text: `const rawBody = await req.text()`. Never parse `req.json()` before passing to `stripe.webhooks.constructEvent`. This is already handled in `src/app/api/webhooks/stripe/route.ts`.

### 5. Order Total Mismatch / Price Spoofing Prevention
* **Symptom**: Discrepancy between the cart total and the Stripe invoice.
* **Explanation**: The client only displays an optimistic total. `/api/checkout` queries the database for active prices and builds the Stripe session from authoritative database prices. If a dish price was changed in the admin panel after a user opened their menu, the checkout API charges the official updated price.

### 6. QR Code Not Opening from Phone
* **Symptom**: Scanning with a phone gives "Server not reachable".
* **Fix**: If using `http://localhost:3000`, your phone cannot access `localhost` on another machine. Follow Section 4.3: bind to `0.0.0.0` (`npm run dev -- -H 0.0.0.0`) and set `NEXT_PUBLIC_APP_URL=http://<your-lan-ip>:3000`.

---

## 9. Architecture Explanation

The system is designed with a unidirectional, tamper-proof state machine:

```text
Customer Smartphone
        │
        ▼ (1. Camera Scan)
Table QR Code (/restaurant/golden-olive/table/{qrToken})
        │
        ▼ (2. View Menu & Add to Cart)
Next.js Customer App (Browser Client)
        │
        ▼ (3. POST /api/checkout with item IDs & quantities)
Next.js API Layer (Server-Side)
        │
        ├──▶ (4. Server queries PostgreSQL for authentic prices)
        │    Supabase DB (menu_items)
        │
        ├──▶ (5. Inserts order with status = 'PENDING')
        │    Supabase DB (orders, order_items)
        │
        ▼ (6. Initiates payment session with order_id in metadata)
Stripe Checkout
        │
        ▼ (7. Customer completes payment with Card/Apple Pay)
Stripe Payment Platform
        │
        ▼ (8. Dispatches checkout.session.completed with signature)
POST /api/webhooks/stripe
        │
        ▼ (9. Verifies signature & marks order 'PAID')
Supabase DB (orders.status = 'PAID')
        │
        ▼ (10. Live Polling / Real-time event)
┌───────────────────────────────────────┬───────────────────────────────────────┐
│ Customer Live Tracker                 │ Kitchen Display System                │
│ (/restaurant/.../order-status/[id])   │ (/admin/orders)                       │
│ Status: "Paid! Kitchen is preparing"  │ Status: "Paid" -> Kitchen advances to │
│                                       │ "Preparing" -> "Ready" -> "Completed" │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

This ensures:
* **Absolute security**: No user can modify prices in the browser inspector.
* **Reliability**: Orders are only treated as paid once Stripe's cryptographic webhook confirms the transaction.
* **Speed**: Zero friction for customers (no account creation, no app download required).

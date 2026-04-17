# launch-template

Generic Next.js template for one-shot micro-launches. Each launch is a clone of this repo: landing page → Stripe Payment Link → instant in-browser download. Fully serverless on Vercel. No webhook, no email, no async anything.

## Shape

```
input from buyer (form on landing page)
        ↓
Stripe Payment Link captures payment
        ↓
Stripe redirects buyer to /success?session_id=cs_xxx
        ↓
/success page verifies session via Stripe API
        ↓
Buyer clicks "Download" → /api/download?session_id=...
        ↓
fulfill({ handle }) → file payload streamed back
```

## Spin-up runbook (manual or AI-driven)

Each new launch follows this exact sequence. Scripts live in `scripts/`.

### 0. Prereqs (one-time, on the user's machine)

- `gh` CLI authenticated to `company-os-ai`
- `vercel` CLI installed (`npm i -g vercel`)
- `node` 20+
- CompanyOS `.env` with: `VERCEL_TOKEN`, `STRIPE_API_KEY`
- CompanyOS `.env.ai` with any per-fulfillment API keys (e.g. `APIFY_API_KEY`)

### 1. Clone the template

```bash
gh repo create company-os-ai/<launch-name> --template company-os-ai/launch-template --public --clone
cd <launch-name>
npm install
```

### 2. Customize fulfillment (optional — skip for an identical clone)

Edit `lib/fulfillment.ts` — replace `fulfill()` body with product-specific logic. Default is a placeholder that returns a hello-world `.txt`.

### 3. Configure `.env.local`

```bash
cp .env.example .env.local
# Fill in: VERCEL_PROJECT_NAME, PRODUCT_NAME, PRODUCT_TAGLINE,
#          INPUT_LABEL, INPUT_PLACEHOLDER, BUY_BUTTON_TEXT
# Leave STRIPE_PAYMENT_LINK + STRIPE_PAYMENT_LINK_ID blank for now.
```

### 4. First deploy (with placeholder Stripe link)

This creates the Vercel project and gives us a live URL.

```bash
./scripts/deploy.sh
```

Capture the URL printed at the end (e.g. `https://<launch-name>.vercel.app`).

### 5. Create the Stripe Payment Link

```bash
STRIPE_API_KEY=$(awk -F= '$1=="STRIPE_API_KEY"{sub(/^[^=]*=/,""); gsub(/^"|"$/,""); print}' ~/Corpus/Repositories/CompanyOS/.env) \
PRODUCT_NAME="<your product name>" \
PRICE_USD=1 \
SUCCESS_URL="https://<launch-name>.vercel.app/success?session_id={CHECKOUT_SESSION_ID}" \
node scripts/setup-stripe.mjs
```

This prints a `Payment Link URL` (e.g. `https://buy.stripe.com/test_...`) and a `link.id` (e.g. `plink_...`).

### 6. Save link details to `.env.local`

```bash
# Edit .env.local:
#   STRIPE_PAYMENT_LINK="https://buy.stripe.com/..."
#   STRIPE_PAYMENT_LINK_ID="plink_..."
```

### 7. Re-deploy with real Stripe link

```bash
./scripts/deploy.sh
```

### 8. Smoke-test

Visit `https://<launch-name>.vercel.app`. Form should render with your product copy. Enter test input → click Buy → pay with Stripe test card `4242 4242 4242 4242` → redirect to `/success` → click Download → file downloads.

If anything fails, the success page surfaces the exact error.

## How handle/input gets through Stripe

The form on `app/page.tsx` posts the input value as `client_reference_id` (a standard Stripe Payment Link URL param). Stripe attaches it to the session. The `/success` page reads `session.client_reference_id` to recover the buyer's input.

## Why no webhook, no email service?

- Stripe sends the buyer a receipt email with the success URL — they can re-download anytime.
- Stripe sends you per-sale notification emails natively — no custom owner ping needed.
- Verifying the session via Stripe API on the success page is just as secure as a webhook signature check.

## Local dev

```bash
cp .env.example .env.local
# fill in values
npm install
npm run dev
```

## Scripts reference

| Script | Purpose |
|---|---|
| `scripts/deploy.sh` | Link Vercel project, push env vars, deploy production |
| `scripts/setup-stripe.mjs` | Create Stripe Product + Price + Payment Link |
| `scripts/update-stripe-success-url.mjs` | Update an existing Payment Link's success URL |
| `scripts/composio-execute-test.mjs` | Validate Composio→external-action path (test posts to Slack) |

## Stack

- Next.js 16 App Router (TypeScript)
- Tailwind CSS 4
- Stripe (Payment Links + session verification only)

No external email service. No webhook. No database. No CompanyOS dependency.

# launch-template

Generic Next.js template for one-shot micro-launches. Spawn one new product per launch — landing page, Stripe payment, instant in-browser download. All serverless on Vercel. No webhook, no email, no async anything.

## Shape

```
input from buyer (form on landing page)
        ↓
Stripe Payment Link captures payment ($1)
        ↓
Stripe redirects buyer to /success?session_id=cs_xxx
        ↓
/success page verifies the session was paid (Stripe API)
        ↓
Buyer clicks "Download" → /api/download?session_id=...
        ↓
fulfill({ handle }) → CSV streamed to browser
```

The default `lib/fulfillment.ts` is the **TokExport** product: takes a TikTok handle, calls a third-party TikTok API, returns a CSV of recent videos with stats and captions.

## How to spin up a new launch

1. **Create the new repo from this template**

   ```bash
   gh repo create company-os-ai/<product-name> --template company-os-ai/launch-template --public --clone
   cd <product-name>
   ```

2. **Edit `app/page.tsx`** (optional — most copy is env-driven via `NEXT_PUBLIC_*` vars).

3. **Edit `lib/fulfillment.ts`** — replace the body of `fulfill()` with the product-specific logic. Input is `{ handle }`. Output is `{ filename, contentType, body }` (body can be a string or Buffer — string for CSV/JSON, Buffer for zip/binary).

4. **Set env vars** (locally in `.env.local` or in Vercel):

   - `NEXT_PUBLIC_PRODUCT_NAME`, `_TAGLINE`, `_INPUT_LABEL`, `_INPUT_PLACEHOLDER`, `_BUY_BUTTON_TEXT`, `_STRIPE_PAYMENT_LINK`
   - `STRIPE_SECRET_KEY`
   - Any product-specific keys (e.g. `TIKTOK_API_KEY`, `TIKTOK_API_URL`)

5. **Deploy**

   ```bash
   vercel deploy --token=$VERCEL_TOKEN --yes --prod
   ```

6. **Wire the Stripe Payment Link**

   In Stripe Dashboard → Payment Links → create a one-time price ($1):
   - **After payment** → Redirect to: `https://<your-vercel-url>/success?session_id={CHECKOUT_SESSION_ID}`
     (the `{CHECKOUT_SESSION_ID}` placeholder is filled in by Stripe automatically)
   - Copy the Payment Link URL → set as `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` in Vercel → redeploy.

## How handle/input gets through Stripe

The form on `app/page.tsx` posts the input value as `client_reference_id` (a standard Stripe Payment Link URL param). Stripe attaches it to the checkout session. The `/success` page reads `session.client_reference_id` to recover the buyer's input.

If you need richer input (multiple fields), switch from Payment Links to Stripe Checkout Sessions and use `metadata`.

## Why no webhook?

Every prior version of this template had a Stripe webhook + an email service (Resend) to deliver the file. We dropped both:

- Stripe **already** sends the buyer a receipt email with the success URL — they can re-download anytime.
- Stripe **already** sends you a per-sale notification email — you don't need a custom owner ping.
- Verifying the session via Stripe API on the success page is just as secure as a webhook signature check (you fetch the session directly from Stripe — they can't fake it).

Result: ~50% fewer files, ~50% fewer env vars, much simpler mental model.

## Local dev

```bash
cp .env.example .env.local
# fill in values
npm install
npm run dev
```

## Stack

- Next.js 16 App Router (TypeScript)
- Tailwind CSS 4
- Stripe (Payment Links + session verification only)

No external email service. No webhook. No database. No CompanyOS dependency.

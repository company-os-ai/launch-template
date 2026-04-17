/**
 * One-shot setup: creates a Stripe Product + Price + Payment Link for a launch.
 *
 * Usage:
 *   STRIPE_API_KEY=sk_live_... \
 *   PRODUCT_NAME="TokExport" \
 *   PRODUCT_DESCRIPTION="Full data export for any TikTok creator..." \
 *   PRICE_USD=1 \
 *   SUCCESS_URL="https://<vercel-url>/success?session_id={CHECKOUT_SESSION_ID}" \
 *   node scripts/setup-stripe.mjs
 *
 * The success URL placeholder is fine for now — Stripe Payment Links can be
 * edited via the Dashboard or API after deploy lands the real Vercel URL.
 */

import Stripe from "stripe";

const key = process.env.STRIPE_API_KEY;
if (!key) {
  console.error("STRIPE_API_KEY not set");
  process.exit(1);
}

const productName = process.env.PRODUCT_NAME;
const productDescription = process.env.PRODUCT_DESCRIPTION ?? productName;
const priceUsd = Number(process.env.PRICE_USD ?? "1");
const successUrl = process.env.SUCCESS_URL;

if (!productName) {
  console.error("PRODUCT_NAME env var required");
  process.exit(1);
}
if (!successUrl) {
  console.error(
    "SUCCESS_URL env var required (e.g. https://<vercel-url>/success?session_id={CHECKOUT_SESSION_ID})",
  );
  process.exit(1);
}

const mode = key.startsWith("sk_live_")
  ? "LIVE"
  : key.startsWith("sk_test_")
    ? "TEST"
    : "UNKNOWN";

console.log(`Stripe mode: ${mode}`);
console.log(`Product:     ${productName}`);
console.log(`Price:       $${priceUsd} USD`);
console.log(`Success URL: ${successUrl}`);
console.log("");

const stripe = new Stripe(key);

console.log("→ Creating product...");
const product = await stripe.products.create({
  name: productName,
  description: productDescription,
});
console.log(`  ✓ ${product.id}`);

console.log("→ Creating price...");
const price = await stripe.prices.create({
  unit_amount: Math.round(priceUsd * 100),
  currency: "usd",
  product: product.id,
});
console.log(`  ✓ ${price.id}`);

console.log("→ Creating Payment Link...");
const link = await stripe.paymentLinks.create({
  line_items: [{ price: price.id, quantity: 1 }],
  after_completion: {
    type: "redirect",
    redirect: { url: successUrl },
  },
});
console.log(`  ✓ ${link.id}`);

console.log("");
console.log("=== Done ===");
console.log(`Payment Link URL: ${link.url}`);
console.log("");
console.log("Set this in your Vercel env as NEXT_PUBLIC_STRIPE_PAYMENT_LINK.");
console.log("");
console.log("To update the success URL later (after Vercel deploy):");
console.log(`  curl https://api.stripe.com/v1/payment_links/${link.id} \\`);
console.log("    -u $STRIPE_API_KEY: \\");
console.log(
  '    -d "after_completion[type]=redirect" \\',
);
console.log(
  '    -d "after_completion[redirect][url]=https://<real-vercel-url>/success?session_id={CHECKOUT_SESSION_ID}"',
);

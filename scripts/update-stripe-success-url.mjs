/**
 * Updates the success URL on an existing Stripe Payment Link.
 *
 * Usage:
 *   STRIPE_API_KEY=... PAYMENT_LINK_ID=plink_... SUCCESS_URL="https://.../success?session_id={CHECKOUT_SESSION_ID}" \
 *     node scripts/update-stripe-success-url.mjs
 */

import Stripe from "stripe";

const key = process.env.STRIPE_API_KEY;
const linkId = process.env.PAYMENT_LINK_ID;
const successUrl = process.env.SUCCESS_URL;

if (!key) {
  console.error("STRIPE_API_KEY not set");
  process.exit(1);
}
if (!linkId) {
  console.error("PAYMENT_LINK_ID not set");
  process.exit(1);
}
if (!successUrl) {
  console.error("SUCCESS_URL not set");
  process.exit(1);
}

const stripe = new Stripe(key);

console.log(`→ Updating ${linkId} success URL to: ${successUrl}`);
const updated = await stripe.paymentLinks.update(linkId, {
  after_completion: {
    type: "redirect",
    redirect: { url: successUrl },
  },
});

console.log(`✓ Updated. Current after_completion:`);
console.log(JSON.stringify(updated.after_completion, null, 2));

/**
 * Generic fulfillment contract.
 *
 * Each launch overrides the body of `fulfill()` with product-specific logic.
 * Input comes from the paid Stripe session (the buyer's text from the landing
 * page form, passed through Stripe as `client_reference_id`). Output is a
 * downloadable file payload that the success page streams back to the buyer.
 *
 * Examples of what `fulfill()` might do per product:
 *   - Call an external API, format the response as CSV (text/csv body)
 *   - Generate a PDF report (application/pdf, Buffer body)
 *   - Bundle several files into a zip (application/zip, Buffer body)
 *
 * The default impl below is a no-op placeholder so a freshly-cloned template
 * builds and runs end-to-end without modification. Replace it.
 */

export type FulfillmentInput = {
  handle: string;
};

export type FulfillmentOutput = {
  filename: string;
  contentType: string;
  body: string | Buffer;
};

export async function fulfill(
  input: FulfillmentInput,
): Promise<FulfillmentOutput> {
  const body = [
    `Hello @${input.handle}`,
    "",
    "This is the default placeholder fulfillment.",
    "Replace lib/fulfillment.ts with your product's logic.",
    "",
  ].join("\n");

  return {
    filename: `${input.handle}.txt`,
    contentType: "text/plain; charset=utf-8",
    body,
  };
}

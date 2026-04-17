import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY not set");
  }
  cachedStripe = new Stripe(key);
  return cachedStripe;
}

export type PaidSession = {
  handle: string;
  email: string | null;
  amountTotal: number | null;
  currency: string | null;
};

export async function verifyPaidSession(
  sessionId: string,
): Promise<PaidSession> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new Error(`session ${sessionId} not paid (status: ${session.payment_status})`);
  }

  const handle =
    session.client_reference_id ??
    session.metadata?.handle ??
    session.custom_fields?.find((f) => f.key === "handle")?.text?.value ??
    null;

  if (!handle) {
    throw new Error(`session ${sessionId} has no handle in client_reference_id or metadata`);
  }

  return {
    handle,
    email: session.customer_details?.email ?? session.customer_email ?? null,
    amountTotal: session.amount_total,
    currency: session.currency,
  };
}

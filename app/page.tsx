const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "Launch";
const tagline = process.env.NEXT_PUBLIC_PRODUCT_TAGLINE ?? "A one-shot product.";
const inputLabel = process.env.NEXT_PUBLIC_INPUT_LABEL ?? "Enter your input";
const inputPlaceholder =
  process.env.NEXT_PUBLIC_INPUT_PLACEHOLDER ?? "@example";
const buyButtonText = process.env.NEXT_PUBLIC_BUY_BUTTON_TEXT ?? "Buy for $1";
const stripePaymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "#";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            {productName}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">{tagline}</p>
        </div>

        <form
          action={stripePaymentLink}
          method="GET"
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {inputLabel}
            </span>
            <input
              type="text"
              name="client_reference_id"
              placeholder={inputPlaceholder}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {buyButtonText}
          </button>
        </form>

        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Powered by Stripe. You&apos;ll receive your delivery by email.
        </p>
      </div>
    </main>
  );
}

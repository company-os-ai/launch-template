import Link from "next/link";
import { verifyPaidSession } from "@/lib/stripe";

const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "Launch";

type SearchParams = Promise<{ session_id?: string }>;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return <ErrorState message="Missing session_id in URL." />;
  }

  let session;
  try {
    session = await verifyPaidSession(session_id);
  } catch (err) {
    return (
      <ErrorState
        message={
          err instanceof Error
            ? err.message
            : "Could not verify your payment session."
        }
      />
    );
  }

  const downloadUrl = `/api/download?session_id=${encodeURIComponent(session_id)}`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Thanks!
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Your {productName} for{" "}
            <span className="font-mono text-zinc-900 dark:text-zinc-100">
              @{session.handle}
            </span>{" "}
            is ready.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <a
            href={downloadUrl}
            className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Download your file
          </a>
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
            You can re-download anytime from this page.
          </p>
        </div>

        <Link
          href="/"
          className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-xl space-y-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Something went wrong
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{message}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          If you paid and can&apos;t see your file, reply to your Stripe receipt
          and we&apos;ll sort it out.
        </p>
        <Link
          href="/"
          className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

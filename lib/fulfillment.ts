/**
 * Generic fulfillment contract.
 *
 * Each launch overrides the body of `fulfill()` to do its product-specific
 * work. Input comes from the paid Stripe session (handle from
 * client_reference_id). Output is a downloadable file payload that the
 * success page streams back to the buyer.
 *
 * The default impl below is the TokExport launch: takes a TikTok handle,
 * calls a third-party TikTok API, returns a CSV of recent videos with stats
 * and captions.
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
  const apiKey = process.env.TIKTOK_API_KEY;
  const apiUrl = process.env.TIKTOK_API_URL;
  if (!apiKey || !apiUrl) {
    throw new Error("TIKTOK_API_KEY or TIKTOK_API_URL not set");
  }

  const handle = input.handle.replace(/^@/, "");

  const response = await fetch(
    `${apiUrl}?username=${encodeURIComponent(handle)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );

  if (!response.ok) {
    throw new Error(
      `TikTok API ${response.status}: ${await response.text().catch(() => "")}`,
    );
  }

  const data = (await response.json()) as TikTokApiResponse;
  const videos = data.videos ?? [];

  const header = "rank,date,url,views,likes,comments,shares,duration,caption";
  const rows = videos.slice(0, 30).map((v, i) =>
    [
      i + 1,
      v.upload_date ?? "",
      v.url ?? "",
      v.views ?? 0,
      v.likes ?? 0,
      v.comments ?? 0,
      v.shares ?? 0,
      v.duration ?? 0,
      csvEscape(v.caption ?? ""),
    ].join(","),
  );
  const csv = [header, ...rows].join("\n");

  return {
    filename: `${handle}-tokexport.csv`,
    contentType: "text/csv; charset=utf-8",
    body: csv,
  };
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type TikTokApiResponse = {
  videos?: Array<{
    upload_date?: string;
    url?: string;
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    duration?: number;
    caption?: string;
  }>;
};

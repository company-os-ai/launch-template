import { NextResponse } from "next/server";
import { verifyPaidSession } from "@/lib/stripe";
import { fulfill } from "@/lib/fulfillment";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "missing session_id" }, { status: 400 });
  }

  let session;
  try {
    session = await verifyPaidSession(sessionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "session check failed";
    return NextResponse.json({ error: message }, { status: 402 });
  }

  let result;
  try {
    result = await fulfill({ handle: session.handle });
  } catch (err) {
    const message = err instanceof Error ? err.message : "fulfillment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const body =
    typeof result.body === "string" ? result.body : new Uint8Array(result.body);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

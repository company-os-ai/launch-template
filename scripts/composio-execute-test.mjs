/**
 * Validates the "user-connected integration → AI can act on it" path:
 *
 * 1. Lists active Composio connections for a toolkit
 * 2. Calls composio.execute against the active one
 * 3. Posts a test message to a Slack channel
 *
 * No new auth, no UI — uses whatever the user already authorized in CompanyOS.
 *
 * Usage:
 *   COMPOSIO_API_KEY=... CHANNEL=C0ALUET4Z0U \
 *     node scripts/composio-execute-test.mjs "hello from CompanyOS terminal"
 */

const apiKey = process.env.COMPOSIO_API_KEY;
if (!apiKey) {
  console.error("COMPOSIO_API_KEY not set");
  process.exit(1);
}

const channel = process.env.CHANNEL ?? "C0ALUET4Z0U"; // #all-companyos
const text =
  process.argv.slice(2).join(" ") ||
  "Hello from the CompanyOS terminal — Composio→Slack path validated.";

const BACKEND = "https://backend.composio.dev/api/v3";

// 1) Find the user's active Slack connection
const list = await fetch(
  `${BACKEND}/connected_accounts?limit=100`,
  { headers: { "x-api-key": apiKey } },
).then((r) => r.json());

const slackConn = list.items.find(
  (c) => c.toolkit?.slug === "slack" && c.status === "ACTIVE",
);
if (!slackConn) {
  console.error("No active Slack connection in this Composio account");
  process.exit(1);
}

console.log(`✓ Found active Slack connection: ${slackConn.id}`);

// 2) Resolve owning user_id (entity)
const detail = await fetch(`${BACKEND}/connected_accounts/${slackConn.id}`, {
  headers: { "x-api-key": apiKey },
}).then((r) => r.json());
const userId = detail.user_id;
console.log(`✓ Owning user_id: ${userId}`);

// 3) Execute SLACK_CHAT_POST_MESSAGE
const result = await fetch(
  `${BACKEND}/tools/execute/SLACK_CHAT_POST_MESSAGE`,
  {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      arguments: { channel, text },
    }),
  },
).then((r) => r.json());

if (!result.successful) {
  console.error("Execute failed:", JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(`✓ Posted to channel ${channel}`);
console.log(`  message ts: ${result.data?.response_data?.ts ?? "?"}`);

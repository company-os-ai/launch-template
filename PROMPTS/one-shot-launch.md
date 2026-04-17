# Battle-hardened prompt: 1-shot launch via launch-template

This is the prompt to paste into a fresh Claude Code session inside the CompanyOS repo to run an end-to-end launch autonomously.

The prompt assumes:
- `gh` CLI authenticated to `company-os-ai`
- `vercel` CLI installed
- CompanyOS `.env` has `VERCEL_TOKEN`, `STRIPE_API_KEY`
- CompanyOS `.env.ai` has `APIFY_API_KEY` (or other per-fulfillment keys)
- Composio Slack connection exists (validated separately)

---

## The prompt

```
You are about to run an end-to-end launch using the launch-template at
github.com/company-os-ai/launch-template. Your job is to clone it, deploy
it as-is, wire Stripe, verify the flow works, and post a "Test" notification
to Slack via Composio.

NAME OF THIS LAUNCH: tokdeploy2
PARENT REPO: company-os-ai/tokdeploy2
VERCEL PROJECT NAME: tokdeploy2
PRICE: $1 (test mode)

This is Test 2 of an autonomous launch capability. Don't customize the
template — clone and deploy as-is. The goal is to validate orchestration,
not creative work.

Work in this exact order. After each step, briefly tell the user what you
just did and what the result was. If a step fails, stop and ask before
retrying — don't loop on errors.

═══════════════════════════════════════════════════════════════════════════
STEP 1 — Strategy capture (lightweight)

Save a brief strategic decision to the brain via MCP, capturing what you're
about to do and why. Use mcp__companyos__execute_command with command
"decision.create" and a body explaining: launching tokdeploy2 as Test 2 of
the autonomous launch flow, identical-clone of launch-template, no
customization.

═══════════════════════════════════════════════════════════════════════════
STEP 2 — Clone the template

cd ~/Corpus/Repositories
gh repo create company-os-ai/tokdeploy2 \
  --template company-os-ai/launch-template \
  --public --clone
cd tokdeploy2
npm install

Verify: `ls` shows app/, lib/, scripts/, package.json. `npm run build`
succeeds.

═══════════════════════════════════════════════════════════════════════════
STEP 3 — Configure .env.local

cp .env.example .env.local

Edit .env.local with these exact values:

  VERCEL_PROJECT_NAME="tokdeploy2"
  PRODUCT_NAME="TokDeploy2 (test)"
  PRODUCT_TAGLINE="Autonomous launch test #2"
  INPUT_LABEL="Your input"
  INPUT_PLACEHOLDER="anything"
  BUY_BUTTON_TEXT="Buy for $1"
  STRIPE_PAYMENT_LINK=""
  STRIPE_PAYMENT_LINK_ID=""

Leave Stripe lines empty for now — we'll fill them in after step 5.

═══════════════════════════════════════════════════════════════════════════
STEP 4 — First deploy (placeholder Stripe)

./scripts/deploy.sh

The script reads .env.local + CompanyOS .env. Captures the deployed URL
from the script's output — should be https://tokdeploy2.vercel.app (or a
unique deployment URL if the alias is taken).

═══════════════════════════════════════════════════════════════════════════
STEP 5 — Create Stripe Payment Link

Read STRIPE_API_KEY from CompanyOS .env (use awk, NOT `source` — sourcing
.env can leak secrets via shell evaluation). Run:

STRIPE_API_KEY=$(awk -F= '$1=="STRIPE_API_KEY"{sub(/^[^=]*=/,""); gsub(/^"|"$/,""); print}' ~/Corpus/Repositories/CompanyOS/.env) \
PRODUCT_NAME="TokDeploy2 (test)" \
PRICE_USD=1 \
SUCCESS_URL="https://tokdeploy2.vercel.app/success?session_id={CHECKOUT_SESSION_ID}" \
node scripts/setup-stripe.mjs

Capture from output:
  - Payment Link URL (https://buy.stripe.com/test_...)
  - Payment Link ID (plink_...)

═══════════════════════════════════════════════════════════════════════════
STEP 6 — Update .env.local with real Stripe values

Edit .env.local:
  STRIPE_PAYMENT_LINK="<URL from step 5>"
  STRIPE_PAYMENT_LINK_ID="<plink_... from step 5>"

═══════════════════════════════════════════════════════════════════════════
STEP 7 — Re-deploy with real Stripe link

./scripts/deploy.sh

Verify the deploy completes. The site at https://tokdeploy2.vercel.app
should now have a working Buy button.

═══════════════════════════════════════════════════════════════════════════
STEP 8 — Verify (don't ask user to test, just check site is up)

curl -fsSL https://tokdeploy2.vercel.app | grep -q "TokDeploy2"

If grep matches, the page rendered with the right product name. Done.

═══════════════════════════════════════════════════════════════════════════
STEP 9 — Post "Test" to Slack via Composio

The launch-template repo has scripts/composio-execute-test.mjs. From the
tokdeploy2 directory:

COMPOSIO_API_KEY=$(awk -F= '$1=="COMPOSIO_API_KEY"{sub(/^[^=]*=/,""); gsub(/^"|"$/,""); print; exit}' ~/Corpus/Repositories/CompanyOS/.env) \
node ../launch-template/scripts/composio-execute-test.mjs "Test — tokdeploy2 launched: https://tokdeploy2.vercel.app"

Confirm "✓ Posted to channel" appears in output.

═══════════════════════════════════════════════════════════════════════════
STEP 10 — Wrap up

Save a learning primitive to the brain capturing what worked, what didn't,
and any prompt improvements you'd suggest for the next iteration.

Tell the user:
  - The live URL: https://tokdeploy2.vercel.app
  - Confirmation Slack message landed
  - Total elapsed time
  - Any steps that needed retries or manual intervention
═══════════════════════════════════════════════════════════════════════════

GUARDRAILS:
- NEVER `source .env` — use awk to extract specific keys (see step 5).
- NEVER pass Vercel/Stripe tokens as `--token` CLI args — use env vars or
  the deploy.sh script which handles this safely.
- NEVER print env var VALUES to chat output. The deploy script's redactor
  catches the known ones but be careful with manual commands.
- If `vercel` CLI prompts for scope, it's "company-os-ed1425a9".
- If Apify returns memory-limit errors, abort stuck runs:
  curl -X POST "https://api.apify.com/v2/actor-runs/<runId>/abort?token=$APIFY_API_KEY"
- Stripe key in CompanyOS .env is named STRIPE_API_KEY but the template
  reads STRIPE_SECRET_KEY — deploy.sh bridges this automatically.
```

---

## Success criteria for Test 2

The test passes if all of these are true:

1. tokdeploy2 GH repo exists and is a clone of the template
2. `https://tokdeploy2.vercel.app` returns 200 with the right product name
3. Stripe Payment Link exists, redirects to the right success URL
4. Slack got the "Test" message
5. AI did NOT need manual intervention from a human at any step
6. Total elapsed time < 15 min

## What this validates

- AI can drive `gh` + `vercel` + Stripe API + Composio API in sequence
- Battle-hardened prompt is robust enough to one-shot
- Template scripts are truly reusable (no edits per launch)
- MCP brain writes work from a fresh session
- The whole thing is repeatable for product N+1

## What this does NOT validate

- AI can customize the template (`lib/fulfillment.ts` swap) — that's Test 3
- AI can pick a brand/product idea — that's Test 4
- Live (real money) Stripe — deferred until iteration is stable
- Composio→X (still needs X dev app) — deferred

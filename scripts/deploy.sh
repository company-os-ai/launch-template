#!/usr/bin/env bash
# Deploy this launch to Vercel: link project, push env vars, deploy production.
#
# Reads:
#   - .env.local                                 (per-launch config: product copy + Payment Link)
#   - $HOME/Corpus/Repositories/CompanyOS/.env   (user secrets: VERCEL_TOKEN, STRIPE_API_KEY)
#   - $HOME/Corpus/Repositories/CompanyOS/.env.ai (user secrets: APIFY_API_KEY etc.)
#
# Required in .env.local:
#   VERCEL_PROJECT_NAME              — the Vercel project (also the .vercel.app subdomain)
#   PRODUCT_NAME, PRODUCT_TAGLINE, INPUT_LABEL, INPUT_PLACEHOLDER, BUY_BUTTON_TEXT
#   STRIPE_PAYMENT_LINK              — full https://buy.stripe.com URL (run setup-stripe.mjs to create)
#
# Required from CompanyOS env:
#   VERCEL_TOKEN
#   STRIPE_API_KEY  (mapped to STRIPE_SECRET_KEY on Vercel)
#   APIFY_API_KEY   (or whatever the per-product fulfillment needs)
#
# Usage:
#   ./scripts/deploy.sh

set -euo pipefail

cd "$(dirname "$0")/.."

read_env_var() {
  local file="$1"
  local var="$2"
  awk -F= -v key="$var" '
    $1 == key {
      sub(/^[^=]*=/, "")
      gsub(/^"|"$/, "")
      gsub(/^'\''|'\''$/, "")
      print
      exit
    }' "$file"
}

LOCAL_ENV=".env.local"
COMPANY_OS_ENV="$HOME/Corpus/Repositories/CompanyOS/.env"
COMPANY_OS_ENV_AI="$HOME/Corpus/Repositories/CompanyOS/.env.ai"

[[ -f "$LOCAL_ENV" ]] || { echo ".env.local missing — copy .env.example and fill in product values"; exit 1; }

# --- Per-launch config from .env.local ---
VERCEL_PROJECT_NAME=$(read_env_var "$LOCAL_ENV" VERCEL_PROJECT_NAME)
PRODUCT_NAME=$(read_env_var "$LOCAL_ENV" PRODUCT_NAME)
PRODUCT_TAGLINE=$(read_env_var "$LOCAL_ENV" PRODUCT_TAGLINE)
INPUT_LABEL=$(read_env_var "$LOCAL_ENV" INPUT_LABEL)
INPUT_PLACEHOLDER=$(read_env_var "$LOCAL_ENV" INPUT_PLACEHOLDER)
BUY_BUTTON_TEXT=$(read_env_var "$LOCAL_ENV" BUY_BUTTON_TEXT)
STRIPE_PAYMENT_LINK=$(read_env_var "$LOCAL_ENV" STRIPE_PAYMENT_LINK)

# --- Secrets from CompanyOS env files ---
VERCEL_TOKEN=$(read_env_var "$COMPANY_OS_ENV" VERCEL_TOKEN)
STRIPE_API_KEY=$(read_env_var "$COMPANY_OS_ENV" STRIPE_API_KEY)
APIFY_API_KEY=$(read_env_var "$COMPANY_OS_ENV_AI" APIFY_API_KEY)
VERCEL_SCOPE="${VERCEL_SCOPE:-company-os-ed1425a9}"

[[ -n "$VERCEL_PROJECT_NAME" ]] || { echo "VERCEL_PROJECT_NAME missing from .env.local"; exit 1; }
[[ -n "$VERCEL_TOKEN" ]] || { echo "VERCEL_TOKEN missing from CompanyOS .env"; exit 1; }
[[ -n "$STRIPE_API_KEY" ]] || { echo "STRIPE_API_KEY missing from CompanyOS .env"; exit 1; }

# --- Redactor: blank known secrets from any output ---
redact() {
  sed \
    -e "s|$VERCEL_TOKEN|<VERCEL_TOKEN_REDACTED>|g" \
    -e "s|$STRIPE_API_KEY|<STRIPE_API_KEY_REDACTED>|g" \
    -e "s|${APIFY_API_KEY:-NEVER_MATCH}|<APIFY_API_KEY_REDACTED>|g"
}

export VERCEL_TOKEN  # CLI picks it up; not passed as argv

run_vercel() {
  vercel "$@" --scope="$VERCEL_SCOPE" 2>&1 | redact
}

echo "→ Linking Vercel project ($VERCEL_PROJECT_NAME)..."
run_vercel link --yes --project="$VERCEL_PROJECT_NAME"

push_env() {
  local name="$1"
  local value="$2"
  [[ -z "$value" ]] && { echo "  ⚠ $name (empty — skipping)"; return; }
  run_vercel env rm "$name" production --yes >/dev/null 2>&1 || true
  printf "%s" "$value" | run_vercel env add "$name" production >/dev/null
  echo "  ✓ $name"
}

echo "→ Pushing server secrets..."
push_env STRIPE_SECRET_KEY "$STRIPE_API_KEY"
[[ -n "$APIFY_API_KEY" ]] && push_env APIFY_API_KEY "$APIFY_API_KEY"

echo "→ Pushing public/product vars..."
push_env NEXT_PUBLIC_PRODUCT_NAME       "$PRODUCT_NAME"
push_env NEXT_PUBLIC_PRODUCT_TAGLINE    "$PRODUCT_TAGLINE"
push_env NEXT_PUBLIC_INPUT_LABEL        "$INPUT_LABEL"
push_env NEXT_PUBLIC_INPUT_PLACEHOLDER  "$INPUT_PLACEHOLDER"
push_env NEXT_PUBLIC_BUY_BUTTON_TEXT    "$BUY_BUTTON_TEXT"
push_env NEXT_PUBLIC_STRIPE_PAYMENT_LINK "$STRIPE_PAYMENT_LINK"

echo "→ Deploying to production..."
run_vercel --prod --yes

#!/usr/bin/env bash
# Production monitor, part 1: what a visitor (or Stripe/Paddle) sees from
# outside. Runs on the GitHub runner. Prints one line per check:
#   OK|WARN|FAIL <name> | <detail>
# Output ends up in public logs and issues: no secrets, no user data.
set -u

SITE="${SITE_URL:-https://scrobbler.bocono-labs.com}"
ADMIN="${ADMIN_URL:-https://ytmusic-scrobbler-admin.vercel.app}"
HOST="${SITE#https://}"

ok() { echo "OK   $1 | $2"; }
warn() { echo "WARN $1 | $2"; }
fail() { echo "FAIL $1 | $2"; }

# expect <name> <method> <url> <accepted codes, space separated>
expect() {
  local name=$1 method=$2 url=$3 accepted=$4 code
  code=$(curl -s -m 30 -o /dev/null -w '%{http_code}' -X "$method" "$url")
  if [[ " $accepted " == *" $code "* ]]; then
    ok "$name" "HTTP $code"
  else
    fail "$name" "HTTP $code (expected $accepted; 000 = no answer)"
  fi
}

expect site-home GET "$SITE/" "200"
expect site-pricing GET "$SITE/pricing" "200"
# Unsigned requests must be rejected: 400 proves the route is deployed and
# checking signatures; 404 means the route is missing, 500 that it is broken.
expect stripe-webhook POST "$SITE/api/webhooks/stripe" "400"
expect paddle-webhook POST "$SITE/api/webhooks/paddle" "400"
# The admin dashboard answers with its page or a redirect to its login.
expect admin-dashboard GET "$ADMIN/" "200 301 302 307 308"

price=$(curl -s -m 30 "$SITE/api/subscription/price")
if echo "$price" | grep -q '"formatted"'; then
  ok pro-price "$(echo "$price" | sed -E 's/.*"formatted":"([^"]*)".*/\1/')"
else
  fail pro-price "the price endpoint returned no price (Stripe key or product misconfigured?)"
fi

seconds=$(curl -s -m 30 -o /dev/null -w '%{time_total}' "$SITE/")
if awk "BEGIN{exit !($seconds > 5)}"; then
  warn site-speed "home page took ${seconds}s"
else
  ok site-speed "home page in ${seconds}s"
fi

expiry=$(echo | openssl s_client -servername "$HOST" -connect "$HOST:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -z "$expiry" ]; then
  fail tls-certificate "could not read the certificate"
else
  days=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))
  if [ "$days" -lt 7 ]; then
    fail tls-certificate "expires in $days days"
  elif [ "$days" -lt 21 ]; then
    warn tls-certificate "expires in $days days"
  else
    ok tls-certificate "valid for $days more days"
  fi
fi

echo "DONE external"

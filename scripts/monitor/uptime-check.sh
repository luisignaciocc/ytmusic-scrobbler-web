#!/usr/bin/env bash
# Quick "is it up?" probe, run every few minutes by .github/workflows/uptime.yml
# (the daily monitor in this folder is the thorough one). Runs on the GitHub
# runner and only looks from outside. Prints one line per target:
#   OK|FAIL <name> | <detail>
# A target must fail twice, RETRY_AFTER seconds apart, to count as down: a
# deploy restarts the web app for a few seconds and must not raise an alarm.
set -u

SITE="${SITE_URL:-https://scrobbler.bocono-labs.com}"
WORKER="${WORKER_URL:-https://scrobbler-worker.bocono-labs.com}"
RETRY_AFTER="${RETRY_AFTER:-90}"

# name|url, each expected to answer 200
TARGETS=(
  "site-home|$SITE/"
  "site-pricing|$SITE/pricing"
  "worker|$WORKER/"
)

probe() { curl -s -m 20 -o /dev/null -w '%{http_code}' "$1"; }

declare -A first
retry=""
for target in "${TARGETS[@]}"; do
  name=${target%%|*}
  first[$name]=$(probe "${target#*|}")
  [ "${first[$name]}" = "200" ] || retry=1
done
[ -n "$retry" ] && sleep "$RETRY_AFTER"

for target in "${TARGETS[@]}"; do
  name=${target%%|*}
  code=${first[$name]}
  if [ "$code" = "200" ]; then
    echo "OK   $name | HTTP 200"
    continue
  fi
  again=$(probe "${target#*|}")
  if [ "$again" = "200" ]; then
    echo "OK   $name | HTTP 200 on the second try (first: HTTP $code)"
  else
    echo "FAIL $name | HTTP $code, then HTTP $again ${RETRY_AFTER}s later (000 = no answer, 503 = the web app is not running)"
  fi
done

#!/usr/bin/env bash
# Runs ON the production server, piped over SSH by .github/workflows/deploy.yml
# (`ssh ... 'bash -s' -- <sha> <web> <worker> < server-deploy.sh`).
#
# The apps are built on the GitHub runner, not here: this machine has 1 GB of
# RAM and building on it took the site down for the length of the build (and
# once hung the whole machine). The runner uploads the finished builds to
# ~/deploy-incoming/ and this script only installs dependencies, applies
# migrations and swaps the builds in, so the site is down for the few seconds
# a restart takes.
#
#   $1  commit the builds were made from
#   $2  "true" when a web build was uploaded      (~/deploy-incoming/web.tgz)
#   $3  "true" when a worker build was uploaded   (~/deploy-incoming/worker.tgz)
set -u
SHA="${1:?commit sha missing}"
DEPLOY_WEB="${2:-false}"
DEPLOY_WORKER="${3:-false}"

export PATH="$PATH:$HOME/.local/share/pnpm:$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | tail -1)"
REPO="${DEPLOY_REPO:-$HOME/ytmusic-scrobbler-web}"
INCOMING="${DEPLOY_INCOMING:-$HOME/deploy-incoming}"
STATUS_DIR="${DEPLOY_STATUS_DIR:-/var/www/scrobbler-status}"
WEB=yt-music-scrobbler-web
WORKER=yt-music-scrobbler-worker
FAILED=""

code_of() { # <method> <url>
  curl -s -o /dev/null -m 10 -X "$1" -w '%{http_code}' "$2"
}

# The new web build is good when it serves real pages and its payment
# webhooks are in place. Unsigned webhook calls must be rejected with 400:
# 404 would mean the route is gone, 500 that it is broken or unconfigured.
# Only things that depend on this machine are checked, so that a problem at
# Stripe or Paddle cannot make a good build look bad and roll it back.
web_healthy() {
  local ready="" url code
  # Up to 90 seconds for the app to come up.
  for _ in $(seq 1 30); do
    [ "$(code_of GET http://localhost:3000/pricing)" = "200" ] && { ready=1; break; }
    sleep 3
  done
  [ -n "$ready" ] || { echo "   /pricing never answered 200"; return 1; }
  code=$(code_of GET http://localhost:3000/)
  [ "$code" = "200" ] || { echo "   / answered HTTP $code"; return 1; }
  for url in /api/webhooks/stripe /api/webhooks/paddle; do
    code=$(code_of POST "http://localhost:3000$url")
    [ "$code" = "400" ] || { echo "   $url answered HTTP $code to an unsigned call (expected 400)"; return 1; }
  done
  return 0
}

# The worker is good when it answers and is still the same process a little
# later: one that crashes on start is restarted by pm2 and looks "online".
worker_healthy() {
  local ready="" pid
  for _ in $(seq 1 20); do
    [ "$(code_of GET http://localhost:4000/)" = "200" ] && { ready=1; break; }
    sleep 3
  done
  [ -n "$ready" ] || { echo "   the worker never answered on port 4000"; return 1; }
  pid=$(pm2 pid "$WORKER")
  sleep 15
  [ -n "$pid" ] && [ "$pid" != "0" ] && [ "$(pm2 pid "$WORKER")" = "$pid" ] ||
    { echo "   the worker restarted by itself right after starting"; return 1; }
  [ "$(code_of GET http://localhost:4000/)" = "200" ] ||
    { echo "   the worker stopped answering"; return 1; }
  return 0
}

cd "$REPO" || { echo "❌ $REPO not found"; exit 1; }

# --- code ---------------------------------------------------------------------
# Move to exactly the commit the builds came from: with anything else the
# uploaded build and the dependencies installed below would not match.
echo "⬇️ Fetching $SHA..."
git fetch origin master || { echo "❌ git fetch failed: aborting deploy"; exit 1; }
git merge --ff-only "$SHA" || { echo "❌ cannot fast-forward to $SHA: aborting deploy"; exit 1; }

# --- dependencies and database --------------------------------------------------
# The worker is stopped first to leave memory for the install, as before. It
# is not user-facing: scrobbling just pauses for a minute.
pm2 stop "$WORKER" || true
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile || FAILED="pnpm install"
if [ -z "$FAILED" ]; then
  pnpm generate || FAILED="prisma generate"
fi
if [ -z "$FAILED" ]; then
  echo "🗄️ Applying database migrations..."
  pnpm exec prisma migrate deploy || FAILED="database migrations"
fi

# --- worker ---------------------------------------------------------------------
if [ -z "$FAILED" ] && [ "$DEPLOY_WORKER" = "true" ]; then
  echo "🔁 Installing the new worker build..."
  rm -rf apps/worker/dist.new apps/worker/dist.prev
  mkdir apps/worker/dist.new
  if tar -xzf "$INCOMING/worker.tgz" -C apps/worker/dist.new --strip-components=1 &&
    [ -f apps/worker/dist.new/main.js ]; then
    [ -d apps/worker/dist ] && mv apps/worker/dist apps/worker/dist.prev
    mv apps/worker/dist.new apps/worker/dist
    echo "🗑️ Clearing Redis..."
    redis-cli flushall
    pm2 flush
  else
    FAILED="worker build upload"
    rm -rf apps/worker/dist.new
  fi
fi
echo "▶️ Starting worker..."
pm2 start "$WORKER"
if [ -z "$FAILED" ]; then
  if worker_healthy; then
    echo "✅ The worker is running"
  else
    FAILED="worker health check"
    if [ -d apps/worker/dist.prev ]; then
      echo "❌ The new worker build is not healthy: going back to the previous one"
      rm -rf apps/worker/dist
      mv apps/worker/dist.prev apps/worker/dist
      pm2 restart "$WORKER"
      worker_healthy && echo "↩️ The previous worker build is running again" ||
        echo "❌ The previous worker build is not healthy either"
    else
      echo "❌ The worker is not healthy (its build did not change in this deploy)"
    fi
  fi
fi
rm -rf apps/worker/dist.prev

# --- web ------------------------------------------------------------------------
if [ -z "$FAILED" ] && [ "$DEPLOY_WEB" = "true" ]; then
  echo "🔁 Installing the new web build..."
  rm -rf apps/web/.next.new apps/web/.next.prev
  mkdir apps/web/.next.new
  if tar -xzf "$INCOMING/web.tgz" -C apps/web/.next.new --strip-components=1 &&
    [ -f apps/web/.next.new/BUILD_ID ]; then
    # nginx shows the maintenance page instead of its error page while this
    # file exists (deploy/status-pages/nginx-snippet.conf). It covers the few
    # seconds of the restart.
    if [ -d "$STATUS_DIR" ]; then
      cp deploy/status-pages/maintenance.html deploy/status-pages/error.html "$STATUS_DIR/" || true
      cp deploy/status-pages/maintenance.html "$STATUS_DIR/maintenance.on.html" || true
    fi
    [ -d apps/web/.next ] && mv apps/web/.next apps/web/.next.prev
    mv apps/web/.next.new apps/web/.next
    pm2 restart "$WEB"
    if web_healthy; then
      echo "✅ The new web build is serving"
      rm -rf apps/web/.next.prev
    else
      FAILED="web health check"
      echo "❌ The new web build is not healthy: going back to the previous one"
      if [ -d apps/web/.next.prev ]; then
        rm -rf apps/web/.next
        mv apps/web/.next.prev apps/web/.next
        pm2 restart "$WEB"
        web_healthy && echo "↩️ The previous build is serving again" ||
          echo "❌ The previous build is not healthy either"
      fi
    fi
  else
    FAILED="web build upload"
    rm -rf apps/web/.next.new
  fi
fi
# Maintenance is over whatever happened: from here on a site that does not
# answer is an error, not a deploy.
rm -f "$STATUS_DIR/maintenance.on.html"

# --- housekeeping -----------------------------------------------------------------
rm -f "$INCOMING/web.tgz" "$INCOMING/worker.tgz"

# Users with no successful scrobble in a week are marked inactive. This used
# to happen as a side effect of building the web app on this machine; it is
# kept here so that deploying still does it.
if [ -z "$FAILED" ] && [ "$DEPLOY_WEB" = "true" ]; then
  secret=$(grep -E '^CRON_SECRET=' .env 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"'"'")
  if [ -n "$secret" ]; then
    code=$(curl -s -o /dev/null -m 60 -w '%{http_code}' -H "Authorization: Bearer $secret" http://localhost:3000/api/cron/deactivate)
    echo "🧹 Inactive-user cleanup: HTTP $code"
  else
    echo "ℹ️ CRON_SECRET is not set in .env: skipping the inactive-user cleanup"
  fi
fi

if [ -n "$FAILED" ]; then
  echo "❌ Deployment failed at: $FAILED (the services run the previous version)"
  exit 1
fi
echo "🎉 Deployment completed: $(git rev-parse --short HEAD)"

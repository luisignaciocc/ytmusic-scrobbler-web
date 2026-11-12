#!/usr/bin/env bash
# Production monitor, part 2: the server itself. Piped over SSH and run ON
# the production server (`ssh ... 'bash -s' < server-check.sh`), so it is
# always the version in the repository. It changes nothing on the server
# (one scratch file in /tmp, removed before it ends).
# Prints one line per check:  OK|WARN|FAIL|INFO <name> | <detail>
# Output ends up in public logs and issues: states and numbers only.
set -u
export PATH="$PATH:$HOME/.local/share/pnpm:$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | tail -1)"
REPO="$HOME/ytmusic-scrobbler-web"

ok() { echo "OK   $1 | $2"; }
warn() { echo "WARN $1 | $2"; }
fail() { echo "FAIL $1 | $2"; }

# --- system services ---------------------------------------------------------
for service in nginx postgresql redis-server; do
  if systemctl is-active --quiet "$service"; then
    ok "service-$service" "active"
  else
    fail "service-$service" "systemd reports: $(systemctl is-active "$service" 2>&1)"
  fi
done

if [ "$(redis-cli ping 2>/dev/null)" = "PONG" ]; then
  ok redis-ping "PONG"
else
  fail redis-ping "redis-cli ping got no PONG (the worker's job queue is down)"
fi

# --- the two apps under pm2 --------------------------------------------------
# An app that keeps crashing still shows as "online" most of the time, so the
# restart counters are read twice, half a minute apart: a counter that moved
# is a crash loop. (A recent restart alone is not: every deploy causes one.)
pm2 jlist > /tmp/monitor-pm2-before.json 2>/dev/null
sleep 30
pm2 jlist 2>/dev/null | node -e '
  const fs = require("fs");
  let raw = "";
  process.stdin.on("data", (c) => (raw += c)).on("end", () => {
    let apps, before;
    try {
      apps = JSON.parse(raw);
      before = JSON.parse(fs.readFileSync("/tmp/monitor-pm2-before.json", "utf8"));
    } catch { console.log("FAIL pm2 | could not read the process list"); return; }
    for (const name of ["yt-music-scrobbler-web", "yt-music-scrobbler-worker"]) {
      const app = apps.find((a) => a.name === name);
      if (!app) { console.log(`FAIL pm2-${name} | not registered in pm2`); continue; }
      const env = app.pm2_env;
      const earlier = before.find((a) => a.name === name);
      const restartsNow = env.restart_time - (earlier ? earlier.pm2_env.restart_time : env.restart_time);
      const upMinutes = Math.round((Date.now() - env.pm_uptime) / 60000);
      const detail = `${env.status}, up ${upMinutes} min`;
      if (env.status !== "online") console.log(`FAIL pm2-${name} | ${detail}`);
      else if (restartsNow > 0) console.log(`FAIL pm2-${name} | crash-looping: restarted ${restartsNow} time(s) in the last 30 seconds`);
      else console.log(`OK   pm2-${name} | ${detail}, no restarts in the last 30 seconds`);
    }
  });
' || fail pm2 "could not run pm2/node on the server"
rm -f /tmp/monitor-pm2-before.json

code=$(curl -s -m 20 -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/)
if [ "$code" = "200" ]; then
  ok web-local "the web app answers on localhost (HTTP 200)"
else
  fail web-local "the web app answers HTTP $code on localhost (000 = not listening)"
fi

# --- the build on disk -------------------------------------------------------
if [ -f "$REPO/apps/web/.next/BUILD_ID" ]; then
  ok web-build "a complete build is present"
else
  fail web-build "apps/web/.next has no BUILD_ID: the last build did not finish, the web app cannot restart"
fi
if [ -d "$REPO/apps/web/.next.prev" ]; then
  warn web-build-leftover "apps/web/.next.prev exists: a deploy was interrupted mid-build"
fi

# --- maintenance page ---------------------------------------------------------
# The deploy shows a maintenance page while it rebuilds the web app and
# removes it when it ends. Left behind, real outages would be presented to
# visitors as planned maintenance.
flag=/var/www/scrobbler-status/maintenance.on.html
if [ ! -f /var/www/scrobbler-status/error.html ]; then
  warn status-pages "the maintenance and error pages are not installed in /var/www/scrobbler-status"
elif [ -f "$flag" ] && [ -n "$(find "$flag" -mmin +60)" ]; then
  fail maintenance-flag "the maintenance page has been switched on for over an hour: a deploy did not finish cleanly (remove $flag)"
elif [ -f "$flag" ]; then
  ok maintenance-flag "switched on: a deploy is rebuilding the web app"
else
  ok maintenance-flag "switched off"
fi

# --- memory, disk, load ------------------------------------------------------
mem() { awk -v k="$1:" '$1 == k { print int($2 / 1024) }' /proc/meminfo; }
available=$(mem MemAvailable)
swap_total=$(mem SwapTotal)
swap_free=$(mem SwapFree)
detail="${available} MB RAM available, ${swap_free} of ${swap_total} MB swap free"
if [ "$swap_total" -gt 0 ] && [ $((swap_free * 100 / swap_total)) -lt 30 ]; then
  fail memory "$detail (the machine hangs when swap runs out)"
elif [ "$available" -lt 80 ]; then
  warn memory "$detail"
else
  ok memory "$detail"
fi

# `-t kernel` rather than `-k`: -k only shows the current boot, and a machine
# that ran out of memory has often been rebooted since.
oom=$( (sudo -n journalctl -t kernel --since "24 hours ago" 2>/dev/null || journalctl -t kernel --since "24 hours ago" 2>/dev/null) | grep -c "Out of memory" )
if [ "${oom:-0}" -gt 0 ]; then
  fail out-of-memory "the kernel killed $oom process(es) for lack of memory in the last 24 hours"
else
  ok out-of-memory "no processes killed for lack of memory in the last 24 hours"
fi

df -P / "$HOME" | awk 'NR > 1 && !seen[$1]++ { gsub("%", "", $5); print $6, $5 }' | while read -r mount used; do
  if [ "$used" -ge 90 ]; then
    fail "disk-$mount" "${used}% used"
  elif [ "$used" -ge 80 ]; then
    warn "disk-$mount" "${used}% used"
  else
    ok "disk-$mount" "${used}% used"
  fi
done

load15=$(cut -d" " -f3 /proc/loadavg)
if awk "BEGIN{exit !($load15 > 4)}"; then
  warn load "15-minute load average is $load15"
else
  ok load "15-minute load average is $load15"
fi

# --- what is deployed (compared with master by the workflow) ----------------
echo "INFO deployed-commit | $(git -C "$REPO" rev-parse HEAD 2>/dev/null)"
echo "DONE server"

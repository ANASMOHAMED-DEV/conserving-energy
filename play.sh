#!/usr/bin/env bash
# Watt Watchers launcher — starts a tiny local server and opens the game.
cd "$(dirname "$0")"
PORT=8080
URL="http://localhost:$PORT"

if command -v python >/dev/null 2>&1; then
  ( sleep 1; (xdg-open "$URL" || open "$URL" || start "$URL") >/dev/null 2>&1 ) &
  python -m http.server "$PORT"
elif command -v python3 >/dev/null 2>&1; then
  ( sleep 1; (xdg-open "$URL" || open "$URL" || start "$URL") >/dev/null 2>&1 ) &
  python3 -m http.server "$PORT"
elif command -v npx >/dev/null 2>&1; then
  npx --yes serve -l "$PORT" .
else
  echo "Need Python or Node installed. Then re-run this script."
  exit 1
fi
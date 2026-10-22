#!/usr/bin/env bash
# Re-renders site/og.png (the link-preview image) from the live hero.
# Needs the local preview running on :4321 (python3 -m http.server 4321 --directory site) and Google Chrome.
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 \
  --virtual-time-budget=6000 --user-data-dir="$PROFILE" \
  --screenshot="$PWD/site/og.png" "http://localhost:4321/?still" 2>/dev/null

echo "wrote site/og.png"

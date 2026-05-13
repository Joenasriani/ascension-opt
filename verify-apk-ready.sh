#!/usr/bin/env bash
set -euo pipefail
for f in index.html manifest.webmanifest service-worker.js offline.html icons/icon-192.png icons/icon-512.png music/thelittlehero.mp3 assets/index-BjuLtVzX.js; do
  test -f "$f" || { echo "Missing $f"; exit 1; }
done
python3 -m json.tool manifest.webmanifest >/dev/null
echo "PWA/APK readiness files exist and manifest JSON is valid."

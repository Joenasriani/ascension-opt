#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "index.html"
  "manifest.webmanifest"
  "service-worker.js"
  "offline.html"
  "levels_1_21.json"
  "assets/index-BjuLtVzX.js"
  "assets/qa-level-select.js"
  "music/thelittlehero.mp3"
  "icons/icon-192.png"
  "icons/icon-512.png"
)

for f in "${required_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "FAIL: missing required file: $f"
    exit 1
  fi
done

python3 -m json.tool manifest.webmanifest >/dev/null
python3 -m json.tool levels_1_21.json >/dev/null

python3 <<'PY'
import json
from pathlib import Path

path = Path("levels_1_21.json")
levels = json.loads(path.read_text(encoding="utf-8"))

errors = []

if not isinstance(levels, list):
    errors.append("levels_1_21.json must contain a top-level array")
else:
    ids = [level.get("id") for level in levels]
    if len(levels) != 21:
        errors.append(f"expected 21 levels, found {len(levels)}")
    if len(ids) != len(set(ids)):
        errors.append("duplicate level IDs found")

    for level in levels:
        level_id = level.get("id")
        blocks = level.get("blocks")
        if not isinstance(blocks, list):
            errors.append(f"level {level_id}: blocks must be an array")
            continue

        block_ids = [block.get("id") for block in blocks]
        block_id_set = set(block_ids)

        if None in block_id_set:
            errors.append(f"level {level_id}: block without id")
        if len(block_ids) != len(block_id_set):
            errors.append(f"level {level_id}: duplicate block IDs found")

        start = level.get("startBlockId")
        end = level.get("endBlockId")
        if start not in block_id_set:
            errors.append(f"level {level_id}: invalid startBlockId {start!r}")
        if end not in block_id_set:
            errors.append(f"level {level_id}: invalid endBlockId {end!r}")

        for block in blocks:
            block_id = block.get("id")
            links = block.get("links", [])
            if not isinstance(links, list):
                errors.append(f"level {level_id} block {block_id}: links must be an array")
                continue
            for target in links:
                if target not in block_id_set:
                    errors.append(
                        f"level {level_id} block {block_id}: broken link -> {target!r}"
                    )

if errors:
    print("STATIC VERIFICATION FAILED")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)

print("STATIC VERIFICATION PASSED")
print("- required repository files present")
print("- manifest.webmanifest is valid JSON")
print("- levels_1_21.json is valid JSON")
print("- 21 levels found")
print("- level IDs unique")
print("- block IDs unique within each level")
print("- start/end block references valid")
print("- all links[] references resolve within their level")
print()
print("Scope note: this does not prove browser runtime behavior, visual correctness,")
print("puzzle solvability, accessibility, performance, or release readiness.")
PY

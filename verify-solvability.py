#!/usr/bin/env python3
"""ASCENSION static gameplay-state solver and bundled-level consistency audit."""
import json
from collections import deque
from pathlib import Path

levels = json.loads(Path("levels_1_21.json").read_text(encoding="utf-8"))
bundle = Path("assets/index-BjuLtVzX.js").read_text(encoding="utf-8")
marker = "_b=["
offset = bundle.find(marker)
if offset == -1:
    raise SystemExit("FAIL: bundled level array marker not found")
embedded, _ = json.JSONDecoder().raw_decode(bundle[offset + len("_b="):])
if embedded != levels:
    raise SystemExit("FAIL: bundled levels do not match levels_1_21.json")

def solve(level):
    blocks = level["blocks"]
    ids = {b["id"]: i for i, b in enumerate(blocks)}
    movable = [(i, b) for i, b in enumerate(blocks) if b["type"] in ("ROTATOR", "SLIDER")]
    m_index = {i: j for j, (i, _) in enumerate(movable)}
    initial = sum((1 << j) for j, (_, b) in enumerate(movable)
                  if ((b.get("rotation", 0) % 2) if b["type"] == "ROTATOR" else b.get("sliderVal", 0)))
    adjacency = [[ids[target] for target in b.get("links", [])] for b in blocks]
    start, end = ids[level["startBlockId"]], ids[level["endBlockId"]]

    def state(i, bits):
        if i in m_index:
            return (bits >> m_index[i]) & 1
        b = blocks[i]
        return b.get("rotation", 0) % 2 if b["type"] == "ROTATOR" else b.get("sliderVal", 0)

    def geometry(i, bits):
        b = blocks[i]
        v = state(i, bits)
        p = b["position"]
        s = b.get("size", {"x": 1, "y": 1, "z": 1})
        widths = (s["z"], s["y"], s["x"]) if b["type"] == "ROTATOR" and v else (s["x"], s["y"], s["z"])
        return (p["x"], p["y"] + (2 * v if b["type"] == "SLIDER" else 0), p["z"]), widths

    def aligned(a, b, bits):
        pa, sa = geometry(a, bits)
        pb, sb = geometry(b, bits)
        return abs(pa[1] - pb[1]) <= .1 and all(
            abs(pa[k] - pb[k]) <= (sa[k] + sb[k]) / 2 + .1 for k in (0, 2)
        )

    def rotator_safe(i, bits):
        pi, si = geometry(i, bits)
        for j in range(len(blocks)):
            if i == j:
                continue
            pj, sj = geometry(j, bits)
            if all(abs(pi[k] - pj[k]) < (si[k] + sj[k]) / 2 - .02 for k in range(3)):
                return False
        return True

    queue = deque([(start, initial)])
    visited = {(start, initial)}
    while queue:
        player, bits = queue.popleft()
        if player == end:
            return True, len(visited)
        for next_player in adjacency[player]:
            candidate = (next_player, bits)
            if candidate not in visited and aligned(player, next_player, bits):
                visited.add(candidate)
                queue.append(candidate)
        for j, (block_index, block) in enumerate(movable):
            next_bits = bits ^ (1 << j)
            candidate = (player, next_bits)
            if candidate in visited:
                continue
            if block["type"] == "ROTATOR" and not rotator_safe(block_index, next_bits):
                continue
            visited.add(candidate)
            queue.append(candidate)
    return False, len(visited)

failures = []
for level in levels:
    success, visited = solve(level)
    print(f"Level {level['id']:02d}: {'REACHABLE' if success else 'UNREACHABLE'} | states={visited}")
    if not success:
        failures.append(level["id"])
if failures:
    raise SystemExit(f"FAIL: unreachable levels: {failures}")
print(f"PASS: {len(levels)} levels have a static modeled route; bundled data exactly matches JSON")
print("LIMIT: does not prove clickable controls, browser execution, responsiveness, or device gameplay.")

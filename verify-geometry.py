#!/usr/bin/env python3
"""Static ASCENSION geometry checks. Does not assert browser solvability."""
import json
from collections import deque
from pathlib import Path

levels = json.loads(Path("levels_1_21.json").read_text(encoding="utf-8"))

def modes(block):
    return (0, 1) if block["type"] in ("ROTATOR", "SLIDER") else (0,)

def position(block, mode):
    p = block["position"]
    return (p["x"], p["y"] + (2 * mode if block["type"] == "SLIDER" else 0), p["z"])

def size(block, mode):
    s = block["size"]
    return (s["z"], s["y"], s["x"]) if block["type"] == "ROTATOR" and mode else (s["x"], s["y"], s["z"])

def connected(a, b, am, bm):
    pa, pb = position(a, am), position(b, bm)
    sa, sb = size(a, am), size(b, bm)
    return abs(pa[1] - pb[1]) <= 0.1 and all(
        abs(pa[i] - pb[i]) <= (sa[i] + sb[i]) / 2 + 0.1 for i in (0, 2)
    )

def overlapping(a, b, am, bm):
    pa, pb = position(a, am), position(b, bm)
    sa, sb = size(a, am), size(b, bm)
    return all(abs(pa[i] - pb[i]) < (sa[i] + sb[i]) / 2 - 0.02 for i in (0, 1, 2))

errors = []
for level in levels:
    lookup = {b["id"]: b for b in level["blocks"]}
    for block in level["blocks"]:
        for target in block.get("links", []):
            other = lookup.get(target)
            if other is None:
                errors.append(f"L{level['id']}: broken link {block['id']} -> {target}")
            elif not any(connected(block, other, a, b) for a in modes(block) for b in modes(other)):
                errors.append(f"L{level['id']}: impossible geometric link {block['id']} -> {target}")

# State-space regression for Level 14. Mirrors runtime click movement, two slider
# heights, 90-degree rotator states, and the implemented rotator overlap guard.
level = next(l for l in levels if l["id"] == 14)
lookup = {b["id"]: b for b in level["blocks"]}
moving = [b for b in level["blocks"] if b["type"] in ("SLIDER", "ROTATOR")]
start_state = tuple(
    ((b.get("rotation", 0) % 2) if b["type"] == "ROTATOR" else b.get("sliderVal", 0))
    for b in moving
)
def state_value(block, state):
    if block["id"] in moving_ids:
        return state[moving_ids[block["id"]]]
    return (block.get("rotation", 0) % 2) if block["type"] == "ROTATOR" else block.get("sliderVal", 0)

moving_ids = {b["id"]: i for i, b in enumerate(moving)}
queue = deque([(level["startBlockId"], start_state)])
seen = set(queue)
reached = False
while queue:
    current, state = queue.popleft()
    if current == level["endBlockId"]:
        reached = True
        break
    block = lookup[current]
    next_states = []
    for name in block.get("links", []):
        target = lookup[name]
        if connected(block, target, state_value(block, state), state_value(target, state)):
            next_states.append((name, state))
    for i, moving_block in enumerate(moving):
        changed = list(state)
        changed[i] = 1 - changed[i]
        if moving_block["type"] == "ROTATOR" and any(
            other["id"] != moving_block["id"] and overlapping(
                moving_block, other, changed[i], state_value(other, state)
            )
            for other in level["blocks"]
        ):
            continue
        next_states.append((current, tuple(changed)))
    for node in next_states:
        if node not in seen:
            seen.add(node)
            queue.append(node)

if not reached:
    errors.append("L14: no start-to-exit route in the tested finite-state model")

if errors:
    print("GEOMETRIC REGRESSION CHECK FAILED")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print(f"GEOMETRIC REGRESSION CHECK PASSED: {len(levels)} levels, linked-edge feasibility, Level 14 route")
print(f"Level 14 explored states: {len(seen)}")
print("Limits: individual-edge feasibility is not an all-level solvability proof.")
print("The Level 14 model does not test browser input, frame timing, or rendering.")

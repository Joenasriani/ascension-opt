# ASCENSION

**Rotate architecture. Align the path. Find your way upward.**

ASCENSION is a playable, browser-based 3D architectural puzzle game by Joe Nasr. Navigate **21 levels** of floating structures, rotating bridges and vertical lifts. The route changes as the architecture moves.

**[▶ PLAY ASCENSION – GitHub Pages](https://joenasriani.github.io/ascension-opt/)** · [Play on itch.io](https://joenasr.itch.io/ascension)

![Repository verification](https://github.com/Joenasriani/ascension-opt/actions/workflows/verify.yml/badge.svg)

## Gameplay screenshots

Real mobile gameplay screenshots. Select any thumbnail to view the original.

<table><tr>
<td align="center"><a href="docs/screenshots/ascension_mobile_screenshot%20(4).jpg"><img src="docs/screenshots/ascension_mobile_screenshot%20(4).jpg" alt="ASCENSION mobile gameplay screenshot 4" width="150"></a></td>
<td align="center"><a href="docs/screenshots/ascension_mobile_screenshot%20(10).jpg"><img src="docs/screenshots/ascension_mobile_screenshot%20(10).jpg" alt="ASCENSION mobile gameplay screenshot 10" width="150"></a></td>
<td align="center"><a href="docs/screenshots/ascension_mobile_screenshot%20(17).jpg"><img src="docs/screenshots/ascension_mobile_screenshot%20(17).jpg" alt="ASCENSION mobile gameplay screenshot 17" width="150"></a></td>
<td align="center"><a href="docs/screenshots/ascension_mobile_screenshot%20(19).jpg"><img src="docs/screenshots/ascension_mobile_screenshot%20(19).jpg" alt="ASCENSION mobile gameplay screenshot 19" width="150"></a></td>
<td align="center"><a href="docs/screenshots/ascension_mobile_screenshot%20(24).jpg"><img src="docs/screenshots/ascension_mobile_screenshot%20(24).jpg" alt="ASCENSION mobile gameplay screenshot 24" width="150"></a></td>
</tr></table>

[View all 10 screenshots](docs/screenshots/)

### What makes it interesting

- **Interactive route geometry:** connected block IDs are not enough; bridges and lifts must also physically align before the actor can cross.
- **One-click corridor movement:** the character visibly travels through intermediate blocks on a clear, directly aligned path, without automatic cornering or bypassing puzzle mechanics.
- **Testable puzzle states:** reference graphs for 21 levels, modeled solvability checks, and targeted Chromium interaction tests document what has and has not been verified.

**For developers:** This is a playable distribution and QA/reference repository, not a complete editable production source release. Read [the technical overview](#what-this-repository-is) and [contribution guide](CONTRIBUTING.md). Public visibility does not grant unrestricted reuse rights; see [Forking and reuse](#forking-and-reuse).

## How ASCENSION plays

- **Walk along connected blocks.** Click an adjacent reachable block to move normally. For a clear, directly aligned corridor at the same elevation, clicking a farther reachable block once sends the actor through each intermediate block in sequence. Movement will not automatically turn corners, cross gaps, bypass disabled mechanisms, or ignore disconnected geometry.
- **Rotate bridges in quarter-turns.** Red handles rotate eligible blocks by 90 degrees, altering their usable footprint. A rotation is rejected if its destination geometry intersects another block.
- **Raise and lower lifts.** Slider handles toggle blocks between their original height and an elevation 2 world units higher, creating or removing connections between tiers.
- **Reach the exit.** Landing on the level's end block triggers completion; continue to the next level or choose **Seek Reflection** for a randomly selected atmospheric passage from a built-in offline collection. This feature does not generate text with an AI service.
- **Progress through 21 structures.** Later levels combine longer paths, multiple rotators, lifts, and elevated routes. Level size alone does not establish difficulty or solvability.

The game includes background music and synthesized interaction sounds. Camera orbit, zoom, and pan controls are exposed through the 3D scene. Runtime behavior has been inspected statically; a complete browser/device playthrough has not been documented.

## What this repository is

This repository contains the current browser-ready ASCENSION distribution build, 21-level graph data, PWA assets, QA utilities, and Android/TWA packaging preparation.

It is **not** a conventional source-development workspace. The playable runtime is checked in as a compiled/minified JavaScript bundle, and there is currently no package manifest or local dependency-install/build workflow.

That distinction matters:

- You can run and inspect the shipped build immediately.
- You can inspect the explicit level graph in `levels_1_21.json`.
- You can contribute documentation, QA, PWA/TWA packaging, verification, and other repository-level improvements.
- Deep gameplay/runtime changes are harder to maintain because the original source tree is not present here.

## See it working

Two public builds are available:

- **itch.io:** https://joenasr.itch.io/ascension
- **GitHub Pages:** https://joenasriani.github.io/ascension-opt/

Repository verification is automated through `.github/workflows/verify.yml`, alongside geometry, solvability, camera, and browser interaction workflows. These checks cover static properties and selected runtime behaviors, not a complete 21-level end-to-end browser playthrough.

Verification is intentionally limited to evidence this repository can reproduce. It does **not** claim browser/device gameplay correctness, visual quality, accessibility, performance, or store-release readiness.

## Run locally

No build step is required.

```bash
git clone https://github.com/Joenasriani/ascension-opt.git
cd ascension-opt
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

Do not open `index.html` directly from the filesystem. A local HTTP server is required.

A network connection is still needed on first load because several runtime dependencies are remote.

## Verify the repository

Run the same checks used by CI:

```bash
bash verify-repo.sh
```

The verifier checks:

- required application/PWA files;
- JSON validity;
- exactly 21 level records;
- unique level IDs;
- unique block IDs within each level;
- valid `startBlockId` and `endBlockId`;
- valid `links[]` references;
- presence of the shipped runtime bundle and core media assets.

A successful verifier run proves those static repository properties only.

## How the game is represented

Each level is a graph of blocks with explicit IDs, positions, dimensions, and `links[]` relationships.

Principal block roles:

- `WALKABLE` – traversable path node.
- `ROTATOR` – movable bridge/path segment whose orientation changes route connectivity.
- `SLIDER` – vertically movable path block used to connect elevations.
- `EMPTY` – non-walkable supporting geometry.

The 21-level reference graph lives in `levels_1_21.json`. Level 14 was previously out of sync; PR #21 corrected the reference file. All 21 records were subsequently compared with the level array embedded in the shipped bundle and found structurally identical. Separate modeled solvability checks cover all 21 levels; these are not equivalent to completing each level through a browser.

## Current implementation

| Area | Current repository evidence |
| --- | --- |
| Rendering | Three.js `0.181.x` through React Three Fiber |
| UI/runtime | React `19.2.x` / React DOM `19.2.x` |
| 3D helpers | `@react-three/drei` `10.7.x` |
| Animation | `@react-spring/three` `10.0.x` |
| Levels | 21 |
| Level data | Linked graph in `levels_1_21.json` |
| Packaging | Static HTML + compiled JS |
| PWA | Manifest, service worker, offline fallback, icons |
| QA | Hidden level selector in `assets/qa-level-select.js` |
| Android path | TWA/Bubblewrap preparation in `README_APK.md` |

## Repository layout

```text
.
├── index.html
├── assets/
│   ├── index-BjuLtVzX.js
│   └── qa-level-select.js
├── levels_1_21.json
├── music/
├── icons/
├── manifest.webmanifest
├── service-worker.js
├── offline.html
├── verify-repo.sh
├── verify-apk-ready.sh
├── README_APK.md
├── CONTRIBUTING.md
└── *_REPORT.*              historical QA / implementation records
```

## Controls

### Desktop

- Click a valid path block to move.
- Drag the scene background to orbit the camera.
- Use rotator handles to change bridge orientation.
- Use slider handles to raise or lower movable blocks.

### Touch

Touch input is routed through the 3D canvas and the browser's pointer/touch handling. Basic tapping is expected to act on puzzle blocks and handles, but gesture-specific behavior and compatibility across devices require a browser/device test before being presented as guaranteed.

## QA level selector

The hidden selector in `assets/qa-level-select.js` can be opened with:

- mobile: `up, up, down, down, left, left, right, right`
- desktop: `ArrowUp, ArrowUp, ArrowDown, ArrowDown, ArrowLeft, ArrowLeft, ArrowRight, ArrowRight`

It is a QA tool, not part of normal progression.

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md).

Good contribution areas include:

- reproducible bug reports;
- documentation and onboarding;
- static verification and CI;
- PWA/TWA packaging;
- accessibility findings;
- browser/device QA evidence;
- improvements to the explicit level graph/reference data when the runtime impact is clearly understood.

Because the editable source tree is not present, gameplay/runtime pull requests must explain how bundled changes were produced and verified.

## Forking and reuse

Forking is useful for experimentation, QA, packaging, documentation, and studying the level graph.

However, **no license file is currently present in this repository**. Do not assume that public visibility grants unrestricted reuse, redistribution, or commercial rights. Licensing should be clarified before substantial reuse outside normal GitHub collaboration.

## Known constraints

- The runtime is compiled/minified; an earlier React/TypeScript/Vite development backup exists at `Joenasriani/ascension`, but it has **not** been verified as equivalent to the current playable distribution.
- There is no package manifest or source rebuild path in this snapshot.
- Several runtime resources remain remote.
- Full offline operation is not guaranteed on first launch.
- PWA/TWA deployment requires HTTPS outside localhost.
- Android Digital Asset Links still require the real release signing certificate fingerprint.
- Historical QA reports are evidence of past checks, not proof of current runtime behavior.

## Adoption signals

The most meaningful adoption signals for this repository are:

1. people successfully running the game;
2. useful forks that add verifiable value;
3. external bug reports with reproduction evidence;
4. accepted pull requests;
5. references from other projects or documentation;
6. repeat contributors.

Stars are useful discovery signals, but they are not treated as proof of adoption.

If you are using or extending ASCENSION, open an issue describing what you used it for and what worked or did not. That creates inspectable adoption evidence instead of vanity-only metrics.

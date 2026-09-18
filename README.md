# ASCENSION

Browser-based 3D architectural puzzle game built around linked paths, rotating structures, vertical sliders, spatial alignment, and constrained movement.

## Repository scope

This repository contains the current browser-ready ASCENSION build and its supporting level data, QA utilities, PWA files, and Android/TWA packaging preparation.

The checked-in application is primarily a distribution build rather than a conventional source-development workspace: the browser runtime is shipped as a compiled JavaScript bundle and the repository does not contain a package manifest or local dependency-install workflow.

### Public builds

- Playable game: https://joenasr.itch.io/ascension
- GitHub Pages build: https://joenasriani.github.io/ascension-opt/

## Current implementation

| Area | Implementation |
| --- | --- |
| Rendering | Three.js `0.181.x` through React Three Fiber |
| UI/runtime | React `19.2.x` / React DOM `19.2.x` |
| 3D helpers | `@react-three/drei` `10.7.x` |
| Animation | `@react-spring/three` `10.0.x` |
| Level set | 21 levels |
| Level representation | Linked block graph stored in `levels_1_21.json` and mirrored in the bundled runtime |
| Primary mechanics | Walkable blocks, rotators, vertical sliders/lifts, endpoint doors |
| Browser packaging | Static HTML + compiled JavaScript assets |
| Offline/PWA support | Web manifest, service worker, offline fallback, local app-shell assets |
| QA tooling | Hidden level-select overlay loaded from `assets/qa-level-select.js` |
| Android path | Trusted Web Activity / Bubblewrap preparation; see `README_APK.md` |

Runtime libraries are resolved through the import map in `index.html`; several dependencies remain remote and therefore require network availability on first load.

## Gameplay model

Each level is represented as a graph of blocks with explicit IDs, positions, dimensions, and `links[]` relationships.

The principal block roles in the current level data are:

- `WALKABLE` — traversable path nodes.
- `ROTATOR` — movable bridge/path segments whose orientation changes route connectivity.
- `SLIDER` — vertically movable path blocks used to connect elevations.
- `EMPTY` — non-walkable supporting geometry.

Player movement is constrained by the current linked-path state and collision rules. Rotator and slider state changes can make previously disconnected route segments traversable.

`levels_1_21.json` contains the explicit audit/reference representation for all 21 levels. Historical repository validation reports record checks for broken intra-level links, duplicate IDs, exact-position duplicates, raised-slider overlaps, and alternate rotator orientations.

## Controls

### Desktop

- Click a valid path block to move.
- Click and drag the scene background to orbit the camera.
- Interact with rotator handles to change bridge orientation.
- Interact with slider handles to raise or lower movable blocks.

### Touch

- Single-finger interaction handles normal block selection and puzzle controls.
- Two-finger cardinal swipes request player movement in the dominant swipe direction.
- Coherent two-finger translation pans the level group on X/Y.
- Pan is suppressed when the gesture is classified as a pinch or significant rotation.

Current gesture thresholds documented by the implementation:

- pinch suppression threshold: normalized distance delta `> 0.01`
- rotation suppression threshold: angle delta `> 0.12` radians
- scene-pan sensitivity: `0.012` world units per pixel of centroid motion

Two-finger movement still passes through the normal linked-block and collision validation; invalid movement requests are ignored.

## Repository layout

```text
.
├── index.html
├── assets/
│   ├── index-BjuLtVzX.js        # compiled game runtime
│   └── qa-level-select.js       # hidden QA level selector
├── levels_1_21.json             # level graph/reference data
├── music/
│   └── thelittlehero.mp3
├── manifest.webmanifest
├── service-worker.js
├── offline.html
├── icons/
├── .well-known/
│   └── assetlinks.example.json
├── apk-package-info.json
├── verify-apk-ready.sh
├── README_APK.md
└── *_REPORT.*                   # historical implementation / QA records
```

## Running locally

No application build step is required for the checked-in distribution.

Serve the repository through a local HTTP server rather than opening `index.html` directly:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

A network connection is still required for runtime modules and other resources that remain CDN-hosted.

## PWA behavior

The repository includes:

- `manifest.webmanifest`
- `service-worker.js`
- `offline.html`
- installable icon assets
- an app-shell cache containing the main document, runtime bundle, audio, manifest, offline page, and icons

The service worker caches same-origin GET responses and falls back to `offline.html` when a same-origin request cannot be fetched.

Remote dependencies are not fully self-contained. `REMOTE_DEPENDENCIES.txt` documents the current external-runtime dependency boundary.

## QA level selector

`assets/qa-level-select.js` provides a hidden level-selection overlay for testing.

Current trigger sequences:

- mobile: `up, up, down, down, left, left, right, right`
- desktop: `ArrowUp, ArrowUp, ArrowDown, ArrowDown, ArrowLeft, ArrowLeft, ArrowRight, ArrowRight`

The selector is a QA utility and is separate from normal level progression.

## Validation notes

The repository contains historical QA and implementation reports. The May 23, 2026 static audit recorded:

- 21/21 level graphs with no broken `links[]` references;
- no duplicate block IDs;
- no duplicate exact transforms in the level data;
- presence of the local runtime bundle, QA selector, and background audio referenced by `index.html`.

Those checks are static repository evidence only. They do not substitute for current browser/device runtime testing, performance profiling, accessibility testing, or store-release validation.

## Android packaging

`README_APK.md` documents the current Trusted Web Activity / Bubblewrap path.

The Android packaging workflow wraps the HTTPS-hosted web application; it is not a separate native gameplay implementation.

## Known constraints

- The checked-in game runtime is compiled/minified, so this repository is not a complete editable source tree for the application.
- Several JavaScript and CSS/font dependencies are loaded remotely.
- Full offline operation is therefore not guaranteed on first launch.
- PWA/TWA deployment requires HTTPS outside localhost.
- Production Android Digital Asset Links require the real release signing certificate fingerprint; the repository contains only a template.
- Historical QA reports explicitly distinguish static checks from unverified runtime/device behavior.

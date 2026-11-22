# ASCENSION – Google Play release materials (draft, pending device verification)

## Identity
- Store title: ASCENSION
- Developer account: questrequestvr@gmail.com
- Android package ID: com.joenasr.ascensionvr (existing repository identity – verify Play Console availability before first upload)
- Android version: 1.0.0 (code 1)
- Free; no advertising SDK has been added to the Android wrapper
- Orientation: landscape
- Release: NOT YET APPROVED – do not upload unsigned AAB or debug APK as production

## Short description (maximum 80 characters)
Rotate impossible architecture and find your way through 21 spatial puzzles.

## Full description
ASCENSION is a minimalist 3D architectural puzzle game about changing perspective.

Walk through floating structures, rotate bridges, and raise or lower platforms to create a path through each impossible space. Every movement changes the way forward.

Explore 21 architectural puzzles built around spatial reasoning, alignment, and discovery.

Features:
- 21 levels featuring connected paths, rotating bridges, and vertical lifts
- Interactive 3D architecture
- Atmospheric music and sound effects
- Landscape gameplay with touch-based controls
- Simple objective: find a route from the start to the exit

A quiet puzzle adventure, one structure at a time.

## Assets present in source repository
- Launcher/icon artwork in icons/ (check image suitability and Android adaptive icon before production)
- 10 historical gameplay screenshots in docs/screenshots/ (verify Android authenticity, dimensions and current presentation)
- No verified final Play feature graphic (1024 x 500) established
- No signed release AAB established

## Submission gates
1. Automated Gradle build success
2. Install the debug APK on an actual Android device
3. Verify launch, level completion, touch controls, audio and resume
4. Verify all 21 levels are mechanically solvable (not just modeled)
5. Confirm remote runtime dependency behavior on normal network, reconnect, and offline
6. Create stable app upload signing key; do NOT rotate it or expose it in GitHub
7. Produce release-signed AAB and verify its package ID and target API
8. Create and host an accurate per-game privacy policy, based on inspected code and actual data use
9. Produce real gameplay screenshots and correct Play feature graphic
10. Complete Play Console content rating, Data Safety, app access, target audience and regional distribution truthfully

## Build
GitHub Actions workflow: .github/workflows/android-package.yml
Packaging source: preserved playable assets/index-BjuLtVzX.js distribution.
Debug APK is for testing, unsigned release AAB cannot be uploaded to Play as-is.
Build uses a local-asset Android WebView, not the repository's previous TWA concept.
Remote resources from aistudiocdn.com, Google Fonts and Tailwind CDN are still in use. Offline-first-run is NOT guaranteed.

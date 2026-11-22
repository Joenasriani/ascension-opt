# ASCENSION Android release – current handoff

Status: verification in progress; NOT READY for Play submission.

## Fixed identity
- Title and launcher label: ASCENSION. Never Ascension VR.
- Account: questrequestvr@gmail.com
- Package and namespace: com.joenasr.ascension (user approved rename).
- Version: 1.0.0 / 1. Target API 36. Minimum API 26. Portrait.
- Free, no advertising or purchases implemented.
- Wrapper: local Android WebViewAssetLoader; historical Bubblewrap/TWA notes do not describe this release.

## Changes in this continuation
- Removed screenshot dependence on emulated /sdcard; stream PNGs directly through ADB and validate PNG chunks.
- Keep logcat, activity, storage, memory and SurfaceFlinger diagnostics on failure.
- Pin Ubuntu 24.04, reduce emulated viewport to 480x854 and allow boot background work to settle.
- Reject ANRs as well as fatal exceptions; screenshots/process existence alone are not gameplay success.
- Drive native Android touches against the compiled debug application; read-only debug observations expose level, actor, mechanisms and projected targets.
- Bind observations to ASCENSION's process rather than another app's WebView.
- Release packaging does not inject the debug observation code.
- Preserved pre-existing Android HDR removal and bundled CSS/fonts.

## Artwork
Approved icon SHA-256: d31d93b3611fd499bcd16ddff23af09351f5c649ee9c43d90a50588a151df10d
The icon in the corrected APK/AAB is byte-identical to the approved release-package image.
Eight original JPGs match repository mobile captures byte-for-byte (1440x2560); they are historical web gameplay captures, not Android captures.
The existing feature graphic is RGB PNG, 1024x500. Preserve approved artwork; never generate replacement gameplay scenes.

## Signing
Use only the existing private ASCENSION upload keystore. No key was generated or rotated.
Expected certificate SHA-256:
98:67:BD:42:69:0A:0C:DA:93:40:08:BB:77:70:D5:47:AC:38:E0:B4:CD:FD:F1:24:37:A9:7C:00:CF:65:3E:E7
The private Drive backup contains the encrypted P12 only. Its original password has not been found in accessible release history.
android/sign-release.py checks this fingerprint before signing and verifies the AAB afterward; credentials must stay outside Git.
Never present an unsigned AAB or debug APK as a Play upload release.

## Play Console
Correct account was verified live. com.joenasr.ascension is available. ASCENSION has not been created yet.
The initial app form is filled as Game / Free, with export-compliance certification pending.
DIORAMA is verified as closed testing, production inactive, with 0 opted-in testers. Production access requires 12 testers continuously opted in for 14 days. Do not claim DIORAMA is published to production.
No production release, legal certification, or store submission has been performed.
Privacy URL: https://joenasriani.github.io/ascension-opt/privacy.html
The currently hosted policy still describes former remote fonts/styles; align it with the final verified Android package before submission.

## Evidence limits
Static solver and geometry checks pass for all 21 levels. This does not establish a full native playthrough.
Read the final Android evidence report and workflow conclusion before making gameplay claims.
API 36 device behavior, audible output, final signing, image encoding compliance and Play acceptance must be verified before marking READY.

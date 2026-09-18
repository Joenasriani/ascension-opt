# ASCENSION — Android / Trusted Web Activity Packaging

This document covers the Android packaging path for the web build in this repository.

The current Android approach uses a **Trusted Web Activity (TWA)** generated with Bubblewrap. The packaged application loads the HTTPS-hosted ASCENSION web build; it is not a separate native gameplay implementation.

## Packaging files

| File | Purpose |
| --- | --- |
| `manifest.webmanifest` | PWA application metadata |
| `service-worker.js` | app-shell and same-origin request caching |
| `offline.html` | same-origin offline fallback |
| `icons/` | standard and maskable launcher icons |
| `.well-known/assetlinks.example.json` | Digital Asset Links template |
| `apk-package-info.json` | retained Android/TWA packaging values |
| `verify-apk-ready.sh` | static presence/manifest validation helper |
| `index.html` | browser entry point and service-worker registration |

## Existing Android identity

The repository currently records the following packaging values:

```text
Package ID:     com.joenasr.ascensionvr
App name:       Ascension VR
Launcher name:  Ascension
Display mode:   fullscreen
Orientation:    landscape
Start URL:      /
Scope:          /
```

Treat the package ID as an existing release identity. Do not change it for an established Play application unless the release/migration consequences have been verified first.

## Requirements

Before generating the Android package:

1. Host the complete web build on an HTTPS origin.
2. Verify the PWA manifest is reachable and valid.
3. Verify the service worker and required local assets resolve from that origin.
4. Install Node.js/npm and Bubblewrap.
5. Obtain the signing-certificate SHA-256 fingerprint that will be used for the Android release.

Localhost is suitable for browser testing, but a verified HTTPS origin is required for the production TWA relationship.

## Verify the hosted web build

After deployment, verify at minimum:

```text
https://YOUR_DOMAIN/
https://YOUR_DOMAIN/manifest.webmanifest
https://YOUR_DOMAIN/service-worker.js
https://YOUR_DOMAIN/icons/icon-512.png
```

The web build also depends on remote runtime resources documented in `REMOTE_DEPENDENCIES.txt`; test first launch with normal network access.

## Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

## Initialize the Android project

```bash
bubblewrap init --manifest=https://YOUR_DOMAIN/manifest.webmanifest
```

During initialization, confirm that the generated configuration matches the intended Android identity and hosted origin.

## Build

```bash
bubblewrap build
```

Typical release artifacts are:

```text
app-release-signed.apk
app-release-bundle.aab
```

Artifact names can vary with Bubblewrap/tooling versions and generated project configuration.

## Digital Asset Links

A fullscreen verified TWA requires a valid Digital Asset Links relationship between the Android package and the production web origin.

The repository contains:

```text
/.well-known/assetlinks.example.json
```

This file is a template only. It intentionally does not contain a valid production signing fingerprint.

For production:

1. Obtain the SHA-256 certificate fingerprint from the actual release signing identity, typically from Play Console app-signing information or the Bubblewrap signing configuration.
2. Copy the template to:

```text
/.well-known/assetlinks.json
```

3. Replace the placeholder fingerprint with the exact release fingerprint.
4. Deploy the file at:

```text
https://YOUR_DOMAIN/.well-known/assetlinks.json
```

5. Verify that the package name and certificate fingerprint match the Android artifact being distributed.

Do not generate a production `assetlinks.json` from an assumed or temporary fingerprint. A mismatch can cause Android to open the application with browser/custom-tab UI rather than as a verified TWA.

## Static packaging check

The repository includes:

```bash
./verify-apk-ready.sh
```

The script checks for the presence of the current browser entry point, manifest, service worker, offline fallback, icons, audio asset, and compiled runtime bundle, then validates the manifest JSON syntax.

It does **not** validate:

- Android signing;
- Digital Asset Links against a deployed origin;
- Play Console configuration;
- runtime behavior on Android devices;
- store-policy compliance;
- performance, memory, battery, or lifecycle behavior.

## Offline behavior

The service worker caches the local application shell and same-origin GET responses.

However, the current web build still references remote JavaScript modules and external CSS/font resources. As a result, a first-run device without network access cannot be treated as fully supported offline.

A fully self-contained Android package would require either:

- localization/bundling of all runtime web dependencies before TWA packaging; or
- a separate native WebView/asset-bundling workflow.

## Release verification

Before store submission, validate the generated build on representative Android hardware and check:

- cold start and resume behavior;
- touch and multi-touch controls;
- orientation and fullscreen behavior;
- service-worker update behavior;
- offline/reconnect behavior;
- audio initialization;
- remote dependency failures;
- Digital Asset Links verification;
- package/signing identity;
- current target-SDK and Play policy requirements.

Store requirements change over time; verify the current Google Play requirements at release time rather than relying on historical values recorded in repository files.

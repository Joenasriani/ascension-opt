# ASCENSION code licensing and reserved assets

The **MIT License** in [LICENSE](LICENSE) is a grant by Joe Nasr **only for original software code for which he holds sufficient licensing rights**. It does not claim ownership of third-party code.

## Scope and third-party components

- Original ASCENSION gameplay/interaction code, authored by or licensed to Joe Nasr with sublicensing rights, is intended to be released under MIT.
- Original repository utility and test code may be reused under MIT **only to the extent the copyright or licensing rights are held by Joe Nasr**. External contributions remain subject to their own valid rights and license grants.
- `assets/index-BjuLtVzX.js` is a compiled/minified distribution bundle that includes third-party framework/library code. **Do not read the MIT notice as relicensing the entire bundle.** Embedded third-party code retains its original license and attribution obligations. Its component-level provenance and notices have not yet been exhaustively audited.
- Remote dependencies (React, React DOM, Three.js, React Three Fiber, drei, react-spring, Tailwind, fonts) are separately licensed by their respective rights holders. Their use in ASCENSION is not a transfer of rights.
- The complete editable production source and a reproducible source-to-bundle build pipeline are not included in this repository; therefore source-level reuse of the shipped compiled bundle remains limited by the unresolved third-party provenance.

## Explicitly excluded – all rights reserved

Unless a separate written license expressly grants rights, the MIT License **does not apply** to:

- `music/` and all recordings, compositions and sound assets, including `music/thelittlehero.mp3`;
- `icons/`, screenshots, illustrations, visual artwork, game artwork, textures, UI art, marketing images, and other non-code creative assets;
- ASCENSION title, logos, trade names, identifying branding, and creator marks (including Joe Nasr);
- original literary/philosophical passages, story content and game narrative text;
- level arrangements and other protectable creative content, where not independently licensed.

Copyright and other rights in these materials remain with their respective owners. Game-play access is not a grant to extract, reuse or redistribute protected assets. The MIT code license does not grant trademark rights.

## Redistribution

Anyone distributing licensed original code must retain the copyright and MIT license notice. Redistributing a playable package containing reserved creative assets or bundled third-party code requires **separate permission or an applicable valid license for those components**.

## Pending due diligence

This repository currently lacks a complete software bill of materials, original-source history and independently verified licenses for every embedded component. The author's licensing authorization for all original code portions and any external contributions needs final provenance review before claiming that the **whole game distribution** is freely redistributable.

See also [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

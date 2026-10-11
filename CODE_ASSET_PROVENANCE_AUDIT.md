# ASCENSION – code and asset provenance audit

Audit date: 2026-10-11  
Status: **Partial source-level inventory; rights clearance not yet complete**  
Production: `Joenasriani/ascension-opt` at `28f03ebf071bc587c1b6f70b6f6021d0bbcf7b40` when audited  
Historical source: `Joenasriani/ascension` (`main`)

## Verified repository evidence

1. The production repository is a **static browser distribution**. It contains a 1,221,778-byte compiled JavaScript bundle (`assets/index-BjuLtVzX.js`), level-reference JSON, scripts, browser tests, HTML, PWA files, icons and a music recording. No `package.json` or complete editable source tree exists in this repository.
2. The historical repository contains React/TypeScript/Vite application source: `App.tsx`, `components/Character.tsx`, `components/GameScene.tsx`, `constants.ts`, `types.ts`, `services/audioService.ts`, `services/geminiService.ts`, `package.json` and related files. Its README explicitly calls it an earlier development backup, **not** the current production source.
3. The historical `package.json` declares React, React DOM, Three.js, React Three Fiber and drei as runtime dependencies. Production `index.html` references these plus react-spring, Tailwind and Google Fonts through external URLs/import maps.
4. The built `assets/index-BjuLtVzX.js` contains bundled runtime/framework code as well as game-specific logic. This audit does not establish the full origins, rights or license notices of every component.
5. `music/thelittlehero.mp3` exists in production (~3.56 MB). The historical repository contains a 2-byte placeholder at the same path, **not** source or ownership evidence for the recording.
6. Thirteen production `icons/*.png` images are present, with no per-asset ownership/license manifest.
7. `levels_1_21.json` contains 21 game structures (~52.7 KB). Game arrangements and associated expression require separate rights treatment from reusable gameplay algorithms.
8. The historical `services/geminiService.ts` contains offline philosophical passages. Their individual textual provenance was **not** verified.
9. Previous PRs and CI prove selected behavior and static consistency, **not** legal title, code authorship, or reproducible equivalence between the historical TypeScript source and current compiled bundle.

## Rights classification

| Files / subject | Classification | Proposed release | Current verification |
| --- | --- | --- | --- |
| Original gameplay algorithms **authored/owned by Joe Nasr**, once isolated from the bundle | Code | MIT | Ownership and extraction **not fully verified** |
| Repository-authored QA scripts, browser tests and verification utilities | Code | MIT **only where contributor/author rights permit** | File inventory checked; individual authorship **not audited** |
| Historical TypeScript/Vite source (`Joenasriani/ascension`) | Earlier source | Candidate for separately licensed code | Production equivalence **not established** |
| Embedded framework/runtime packages inside the shipped bundle | Third-party software | Retain each original license and notices | Complete SBOM and notice inventory **missing** |
| Remote JS dependencies, Tailwind and Google Fonts | Third-party software/fonts | Comply with upstream license per package/file/version | Dependency names known; exact resolution/license audit **pending** |
| `music/thelittlehero.mp3`, composed audio, sound recordings | Protected creative assets | Exclude from MIT | Rights-holder and chain of title **unverified** |
| `icons/*.png`, visual artwork, screenshots, marketing imagery | Protected creative assets | Exclude from MIT | File inventory checked; origin **unverified** |
| ASCENSION name, logos, creator branding | Branding/trademarks | Reserved | No trademark registration claim made |
| Philosophical passages, prose and narrative | Literary expression | Exclude from MIT | Authorship and quotation rights **unverified** |
| Specific puzzle level layouts and designed arrangements | Creative expression / data | Reserve pending separate decision | Reference JSON inventoried; rights analysis **pending** |
| HTML, PWA metadata, service worker and documentation | Mixed source / expression | MIT for code portions only, as rights permit | File inventory checked; ownership **not verified** |

## Release blockers before claiming the complete game is open source

- Reconstruct **editable production source** and reproduce a build that matches production gameplay without substituting the earlier backup.
- Complete a file/package-level **software bill of materials (SBOM)**, with actual resolved versions and licenses, and preserve third-party copyright notices.
- Review commit/contributor and AI-assisted code provenance where available; confirm the right to license each original-code portion under MIT.
- Confirm rights to the music, icons, narrative and other reserved assets. If their reuse is not permitted, provide independently licensed replacement assets or a code-only build/test path that does not package them.
- Decide whether and how level layout data is distributed or substituted with demonstration/test levels.
- Document a reproducible build command and an asset-free developer example.

## Release rule

**Do not label the entire compiled game or its complete asset package “MIT licensed.”** The draft `LICENSE` and `LICENSE_SCOPE.md` communicate an MIT offer limited to rights-owned original code and explicit creative-asset exclusions. Their presence is not proof that the combined browser package can be independently redistributed.

## Audit limits

The inventory above comes from GitHub file trees, selected source files, production `index.html` and repository documentation. No legal chain-of-title records, dependency lockfile/SBOM, build reproduction, or comparison against complete production authoring history was available. This is a technical provenance assessment, **not a legal opinion**.

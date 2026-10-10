# Contributing to ASCENSION

Thanks for considering a contribution.

Before changing anything, understand the repository boundary: this is primarily a **browser-ready distribution snapshot**, not a conventional editable source tree. The shipped game runtime is compiled/minified JavaScript.

That affects which contributions are easy to review and maintain.

## Best contribution areas

Contributions are especially useful in these areas:

- reproducible browser/device bug reports;
- accessibility findings;
- documentation and onboarding;
- static verification scripts;
- GitHub Actions / CI;
- PWA and TWA packaging;
- QA utilities;
- level-graph analysis;
- performance measurements with reproducible evidence.

## Runtime and gameplay changes

Runtime/gameplay changes are possible, but they need extra evidence because the original source tree is not present.

A pull request that changes `assets/index-BjuLtVzX.js` should include:

1. exactly what behavior changed;
2. why the bundled file had to be edited directly;
3. the commands used to validate syntax or structure;
4. browser/device test conditions, if runtime testing was performed;
5. known limitations and anything that remains unverified.

Do not describe a static check as a gameplay test.

## Level-data changes

`levels_1_21.json` is the explicit reference graph for the 21 levels.

If you change it:

1. keep level IDs unique;
2. keep block IDs unique within each level;
3. preserve valid `startBlockId` and `endBlockId`;
4. ensure every entry in `links[]` resolves to a block in the same level;
5. run `bash verify-repo.sh`;
6. explain whether and how the compiled runtime was kept in sync.

A passing static verifier does not prove a puzzle is solvable.

## Before opening a pull request

Run:

```bash
bash verify-repo.sh
```

For browser-facing changes, also test through an HTTP server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## Bug reports

A useful bug report includes:

- browser and version;
- operating system/device;
- level number;
- exact steps to reproduce;
- expected behavior;
- observed behavior;
- screenshot or short recording when visual/spatial behavior is involved;
- whether the problem reproduces after a fresh reload.

## Pull-request scope

Prefer small, reviewable pull requests with one purpose.

Good examples:

- improve local-run instructions;
- add a deterministic graph validator;
- fix a service-worker caching bug;
- document a reproducible device issue.

Avoid mixing unrelated gameplay, UI, packaging, and documentation changes in one PR unless they are inseparable.

## Evidence standard

Use precise language:

- **verified** – directly reproduced by a command, test, or observed runtime check;
- **historical evidence** – supported by an older report or prior test;
- **inferred** – reasoned from code/data but not directly executed;
- **unverified** – not tested in the current change.

This keeps the repository trustworthy for future contributors.

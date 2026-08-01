# Tahlkscribe

Website for [Tahlk](https://github.com/GreenbarSystems/Tahlk), an ambient AI scribe launching in behavioral health and podiatry.

## Status

The pages at the repo root (`index.html`, `security.html`, `compliance.html`, `how-it-works.html`, `get-started.html`, `legal.html`, `about.html`) are **design mockups**, not a finalized, legally-reviewed site. In particular:

- The Legal page is a document index, not actual contract text — the BAA, EULA, and Patient Privacy Notice Template are real documents handled through onboarding; the Website Terms of Use and Website Privacy Policy are placeholders pending real drafting.
- The Compliance page's framework determinations are explicitly labeled as drafts pending legal sign-off, mirroring the source documents in the Tahlk repo.
- The About page intentionally omits team, location, and founding history — those weren't fabricated in and should be added when ready.

## Rebuilding

Each page is a static HTML file with the brand fonts inlined as base64 `data:` URIs (no external font requests). Source templates live in `build/templates/`; run:

```
node build/build.js
```

from the repo root to regenerate all seven pages after editing a template.

## Structure

- `*.html` — the built, deployable pages (self-contained, no external asset requests)
- `build/templates/*.template.html` — editable sources with `__LATIN_B64__` / `__LATINEXT_B64__` placeholders
- `build/fonts/` — the two self-hosted Montserrat woff2 subsets, matching `public/fonts/` in the Tahlk app repo
- `build/build.js` — inlines the fonts and writes the root-level pages

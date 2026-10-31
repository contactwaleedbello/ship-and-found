# DG Tech Store — Task 1 Design System

## 1. What this is

DG Tech Store is a smartphone and laptop shop serving students, workers and traders, and the one thing this screen must do is let a customer check availability, current price and battery information and then contact the shop on WhatsApp or by phone.

This repository is the Task 1 repository. It contains the design-system source, the generated CSS, one illustrative product screen, the Task 1 documentation and the evidence. The repository-level README and the Task 1 README are combined in this file so the assessment structure is explicit: one repository for Task 1.

## 2. Status

**Implemented and verified**

- Figma-derived token JSON with 382 variables in six collections.
- 39 colour roles, 47 documented contrast pairs, 15 type styles and three shadows.
- Reproducible JSON → CSS build with no runtime dependencies.
- Token checker that rejects raw hex/rgb/hsl and primitive references in interface code.
- One responsive product screen using role tokens only.
- Deliberate regression test with a deleted, unmerged branch.
- Self-hosted Fira Sans/Noto Sans with Hausa/Yoruba glyph coverage.
- Actual 400% browser zoom verified in a headful Brave window (`glyph-test-browser-zoom-400-*.png`), plus a 360px no-horizontal-overflow check.
- Full ten-combination Yoruba test, two-line stacked-diacritic specimen, and Naira check.

- Token export divergence (`evidence/05-tokens-incomplete.json` vs `evidence/06-tokens-complete.json`) is documented and verified from the JSON files.

**Implemented but limited**

- Noto Sans is declared at **weight 400 only**. The required Hausa/Yoruba/Naira glyphs are verified in Fira Sans; if a missing Fira glyph falls back at 500/600/700, Noto's bold may be synthesised rather than separately loaded. See `styles/fonts.css` and `docs/type-scale.md`.
- The product screen is an explicitly labelled **sample listing**. The owner did not provide a production catalogue, stock quantities, prices or specifications. Do not treat the sample as commercial data.
- WhatsApp and Call use the correct `wa.me`/`tel:` schemes, but the destination is the explicit `REPLACE_WITH_OWNER_NUMBER` placeholder until the owner supplies the number. The page shows a visible pending note.
- The page is English. Hausa/Yoruba glyph coverage is preserved for product names, customer messages and future localisation; a full multilingual interface is not implemented and is not claimed.

**Not started**

- Tasks 2–5.
- Full product catalogue, category navigation, search, checkout, accounts or order management. These are outside Task 1.

## 3. Stack, with reasons

| Choice | Reason |
|---|---|
| Figma variables and text/effect styles | The brief requires the colour, typography and shadow system to be built in Figma, with colour variables included in the export. |
| `tokens/tokens.json` | One machine-readable source for primitives and semantic roles; the complete export is preserved as `evidence/06-tokens-complete.json`. |
| Node scripts with no dependencies | `scripts/build-tokens.js` converts JSON to CSS and `scripts/check-tokens.js` enforces role-token usage. No package manager or framework is needed for the Task 1 proof. |
| Static HTML/CSS product screen | The assessment needs one screen that proves the agent consumed the system, not a full application. A static screen keeps the token usage inspectable and avoids framework noise. |
| Self-hosted Fira Sans / Noto Sans WOFF2 | The confirmed language context requires Hausa/Yoruba glyph coverage. Fira Sans covers the required characters; Noto Sans is the fallback. Local subsets avoid a third-party font request. |
| No JavaScript framework | A framework would add build and runtime cost without improving the design-system proof. Task 2 will introduce the application scaffold. |

## 4. Getting started

Requirements: Node.js 18+ and Python 3 (for the optional static server), or any static file server.

```bash
git clone https://github.com/contactwaleedbello/ship-and-found.git
cd ship-and-found

# Rebuild the token CSS from tokens/tokens.json (the generated CSS is committed)
node scripts/build-tokens.js

# Verify that interface code uses role tokens only
node scripts/check-tokens.js

# Serve the repository and open the screen
python3 -m http.server 8000
# Open http://localhost:8000/src/
```

The page can also be opened directly from `src/index.html`; the relative links to `styles/fonts.css` and `styles/tokens/index.css` resolve from the file system. The server is recommended so font and stylesheet loading matches a browser deployment.

The repository is public at `https://github.com/contactwaleedbello/ship-and-found` (verified 2026-10-31). The final local work still has to be committed and pushed; until that happens the public repository still shows commit `30b18e7` and does not contain this README or the newer evidence.

## 5. Environment variables

**None.** The Task 1 screen and token build require no environment variables, database, API key or `.env` file. Do not add secrets or the owner's phone number to the repository.

## 6. What this deliberately does not do

- It does not implement a full shop: no catalogue index, search, cart, checkout, payment, account, order tracking or inventory management.
- It does not claim a full Hausa or Yoruba interface. The page is English; the type system preserves glyph coverage for the languages the owner and customers use.
- It does not present sample product data as real. The Samsung Galaxy A15 listing, price and specifications are illustrative and labelled as sample.
- It does not publish the owner's phone number. Contact links are placeholders until the owner provides the destination.
- It does not cover Tasks 2–5.

## 7. Known defects

The full, file-and-line defect log is in [`docs/defects.md`](docs/defects.md). Current known defects:

1. Hard-coded `600px`/`840px` media queries in `src/style.css`; no generated breakpoint tokens.
2. No `1200px`/`1600px` layout blocks on the product page, so the two-column layout stretches on very wide screens.
3. Sample product, price and specification data remains on the page; it is labelled as sample but must be replaced before production.
4. Shadow tokens emit `rgb(100 13 0 / ...)` instead of a bound colour token, so a primary-palette change does not update shadows automatically.
5. The 3-column specification grid can be cramped inside the 2-column layout around `900px`.
6. WhatsApp and Call destinations are explicit placeholders pending the owner's number; they are not working contact routes yet.
7. The original build-agent transcript for Prompt 1 and the full written typography answer were not preserved; see `docs/prompts.md` and `evidence/08-agent-typography-answer.txt`.

The previous error-colour discount defect is resolved: the discount badge was removed and the reserved `.price-discount` rule now uses the tertiary container role.

## 8. Task 1 summary

**What the task was:** build a design system, export it as tokens, convert it to CSS, and prove an agent consumed it rather than assuming it did.

**What was built:** a Figma-derived token set; 39 colour roles with contrast ratios; 15 type styles with line-height and letter-spacing divergences; three brand-tinted shadows; a generated CSS token layer; a role-token-only product screen; a raw-value search; before/after screen evidence; a deliberate broken-reference regression; a deleted, unmerged branch; and a defect log.

**Key decisions:** pin primary 40 to the receipt-derived brand colour; use 14 base tones plus key/surface tones; use 1.4/1.5/1.6 line-height multipliers; use Fira Sans for the required glyphs with a Noto Sans 400-only fallback; use role tokens only in interface code; build shadows from primary/20 rather than black.

**What went wrong:** hard-coded breakpoints, missing wide-screen layouts, a raw shadow colour, unverified sample marketing claims, placeholder contact destinations, the repository originally had no README (this file now supplies it), and evidence gaps around the original agent transcript and typography answer. These are recorded rather than hidden.

**Business context:** [`docs/business-brief.md`](docs/business-brief.md) is the concise confirmed brief; [`docs/owner-answers.txt`](docs/owner-answers.txt) records the owner-provided responses and distinguishes them from a WhatsApp transcript; [`docs/reconciliation.md`](docs/reconciliation.md) records the design implications and the reconciliation changes.

**Figma & token-export divergence:** file ID `Nh1cw8CbrXHXCpzwraF3DD` ([Figma design file](https://www.figma.com/design/Nh1cw8CbrXHXCpzwraF3DD/Untitled?node-id=0-1&t=Ydgj0UC7KZyLpgRn-1); page "Color System"). The link was supplied by the owner; view access is not independently verified from this environment. The palette and typography exports are `evidence/01-palette-before-pin.png` through `evidence/04-spacing-chosen.png`; the variables panel and the 15 text/3 effect styles are captured in `evidence/Figma variables panel evidence.png` and `evidence/Figma text-effect style evidence.png`. The initial export `evidence/05-tokens-incomplete.json` (252 lines, 6,965 bytes) contained only `meta` (`includes: "text styles and effect styles only"`), 15 `textStyles` and 3 `effectStyles`, and omitted the entire `variables` object (all 6 variable collections and all 382 variables: `Primitives` 182, `colour roles` 39, `typography` 75, `spacing roles` 44, `shape roles` 21, `shadow roles` 21). The omission was identified by inspecting the top-level JSON keys (`meta`, `textStyles`, `effectStyles` with no `variables.collections`), seeing unresolved `{typography:*}` variable references inside `textStyles[].boundVariables`, and noting that `scripts/build-tokens.js` requires `variables.collections[]` to emit primitives, semantic role aliases, breakpoint `@media` widths, and typography weights. Re-running the extraction produced `evidence/06-tokens-complete.json` (3,193 lines, 65,125 bytes, copied to `tokens/tokens.json`), which adds all 6 collections (382 variables) alongside the identical 15 `textStyles` and 3 `effectStyles`.

**Evidence map**

| File | What it shows |
|---|---|
| `evidence/01-palette-before-pin.png` / `evidence/02-palette-after-pin.png` | Primary palette before/after pinning primary 40 |
| `evidence/03-spacing-default.png` / `evidence/04-spacing-chosen.png` | Display-large at default vs chosen letter spacing |
| `evidence/05-tokens-incomplete.json` / `evidence/06-tokens-complete.json` | Incomplete export (15 `textStyles` + 3 `effectStyles` only, missing `variables`) vs complete export (adds 6 collections / 382 variables) |
| `evidence/07-raw-value-search.txt` | Canonical raw-value search commands and output |
| `evidence/08-agent-typography-answer.txt` | Typography answer snippet (full transcript outstanding) |
| `evidence/09-screen-without-system.png` / `evidence/10-screen-with-system.png` | Screen without/with the design system |
| `evidence/11-broken-referencing.png` | Broken token referencing screenshot |
| `evidence/11-broken-referencing-check-output.txt` | Token-check output for the broken branch |
| `evidence/12-git-log-branch-unmerged.txt` | Regression branch not merged |
| `evidence/Figma variables panel evidence.png` | Figma variables collections and counts |
| `evidence/Figma text-effect style evidence.png` | Figma 15 text styles and 3 effect styles |
| `evidence/Hausa letters — Ƙƙ and Ƴƴ comparison.png` | Hausa hooked-letter design comparison |
| `evidence/Stacked diacritics — two-line line-height specimen.png` | Figma two-line/80px diacritic specimen |
| `evidence/glyph-test.html` | Reproducible 360px-below glyph verification page with full Hausa, ten-combination Yoruba and Naira sets |
| `evidence/glyph-test-hausa-yoruba.png` | Figma glyph reference |
| `evidence/glyph-test-hausa-yoruba-400.png` | Equivalent 360 CSS-pixel viewport rendered at device pixel ratio 4; not actual browser zoom (historical only) |
| `evidence/glyph-test-browser-zoom-400-hausa.png` | Actual 400% browser zoom — URL, zoom bubble, top/Hausa |
| `evidence/glyph-test-browser-zoom-400-hausa-page.png` | Actual 400% page capture — full Hausa `Ɓɓ Ɗɗ Ƙƙ Ƴƴ` |
| `evidence/glyph-test-browser-zoom-400-yoruba.png` | Actual 400% browser zoom — all ten Yoruba combinations, two lines |
| `evidence/glyph-test-browser-zoom-400-naira.png` | Actual 400% browser zoom — Naira and expected-result note |
| `evidence/glyph-test-browser-zoom-400.txt` | Browser version, timestamp, metrics, font/glyph results for the actual 400% test |
| `evidence/glyph-test-320.txt` | 320px responsive test-frame measurements, no overflow |
| `evidence/responsive-360-900-1200.txt` | Canonical iframe and headless viewport width measurements (360, 900, 1200px) with browser/version/date/DPR; not zoom evidence |
| `evidence/13-walkthrough.mp4` | Optional walkthrough, not recorded |

## 9. Design-system files

- `tokens/tokens.json` — source tokens.
- `styles/tokens/primitives.css`, `roles.css`, `index.css` — generated CSS. Do not hand-edit.
- `styles/fonts.css`, `styles/fonts/` — self-hosted fonts and OFL licences.
- `scripts/build-tokens.js`, `scripts/check-tokens.js` — build and enforcement.
- `src/index.html`, `src/style.css` — the product screen.
- `docs/` — business brief, type scale, colour roles, shadows, divergences, prompts, defects, interview answers, reconciliation.

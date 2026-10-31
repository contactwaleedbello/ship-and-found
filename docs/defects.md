# Defects in the product page and token build

Updated 2026-10-31 after the owner-provided business-context reconciliation. Resolved defects are retained for audit history; current defects are marked **Open**.

## 1. Hard-coded breakpoints in CSS — Open
- **What it is:** The `@media` queries in the page stylesheet use raw pixel numbers (`840px`, `600px`, `600px`) instead of reading the breakpoint tokens.
- **Where:** `src/style.css` lines 96 (`@media (min-width: 840px)`), 298 (`@media (min-width: 600px)`) and 344 (`@media (min-width: 600px)`). `scripts/build-tokens.js` (lines 245, 753–759) skips emitting `spacing roles/breakpoint/*` as tokens and only uses `breakpoint/min-width` for the `@media` blocks in `styles/tokens/roles.css`.
- **Why it matters:** If a breakpoint changes in `tokens/tokens.json` and the token CSS is rebuilt, `styles/tokens/roles.css` updates its `@media` queries automatically, but `src/style.css` stays at `600px` and `840px`, putting the page layout out of sync with its spacing tokens.
- **Fix:** Generate the breakpoint queries in `src/style.css` from `tokens/tokens.json` during the build (or emit `@custom-media` / build-time breakpoint rules from `breakpoint/min-width`).

## 2. Missing 1200px and 1600px breakpoint blocks — Open
- **What it is:** The design system defines five breakpoint modes (Compact `<600px`, Medium `600px`, Expanded `840px`, Large `1200px`, Extra-large `1600px`), but the page stylesheet only writes layout rules for `600px` and `840px`.
- **Where:** `styles/tokens/roles.css` defines `@media (min-width: 1200px)` at line 274 and `@media (min-width: 1600px)` at line 321, while `src/style.css` stops at `@media (min-width: 840px)` at line 96 and has no 1200px or 1600px blocks.
- **Why it matters:** On Large (`1200px+`) and Extra-large (`1600px+`) screens, `.product-layout` keeps the `840px` equal two-column rule (`grid-template-columns: 1fr 1fr`) with `width: 100%` and no max-width or fixed-pane sizing, so the product photo box and text columns stretch across the entire wide screen.
- **Fix:** Add `@media (min-width: 1200px)` and `@media (min-width: 1600px)` layout rules in `src/style.css`, generated from the breakpoint tokens, using `--spacing-layout-fixed-pane-width` or a constrained layout width.

## 3. Error colour role used for a discount — Resolved
- **What it was:** The `"Save ₦15,000"` discount badge used `--color-error-container` and `--color-on-error-container`.
- **Where:** `src/style.css` lines 235–242 still define `.price-discount`, but it is **not used** in `src/index.html` after reconciliation. The rule now uses `--color-tertiary-container` / `--color-on-tertiary-container` if a future positive-offer badge uses it.
- **Why it mattered:** The error role is reserved for urgent error states; a positive saving is not an error.
- **Status:** The discount badge was removed from the page. The residual class is corrected so it cannot repeat the error-role misuse.

## 4. Sample product data remains on a customer-facing page — Open (reduced)
- **What it is:** The page still shows an illustrative Samsung Galaxy A15 listing, a sample price (`₦185,000`) and sample technical specifications. The owner did not provide a product catalogue, stock quantities, prices, ratings or specifications in this reconciliation.
- **Where:** `src/index.html` lines 52–53 (`Smartphone` / `Sample listing`), 59 (`Sample product data...`), 71 (`₦185,000`), 73 (`Sample price...`), 79 (sample description), 84 (`Key specifications (sample)`) and 87–108 (sample specs).
- **What was removed:** `₦200,000`, `Save ₦15,000`, `Same-Day Fast Dispatch Available`, `100% Genuine Guaranteed`, `Official Samsung`, `Special Offer`, `12 months warranty`, `Pay on delivery available`, `Inspect...`, `Fast dispatch to your doorstep`, `Brand New Sealed Unit`, `12 Months Official Warranty` and `Quality guaranteed`.
- **Why it matters:** The page must not present unverified product, price, stock or performance claims as fact. The current page is explicitly labelled as a design-system sample, but it is not a production catalogue.
- **Fix:** Before production, replace the sample listing with owner-verified products, prices, availability and specifications. Keep the battery specification easy to find; do not add performance claims without evidence.

## 5. Shadow colour not bound to a variable — Open
- **What it is:** The three shadow tokens emit a hard-coded RGB literal (`rgb(100 13 0 / ...)`) instead of referencing a colour variable.
- **Where:** `styles/tokens/roles.css` lines 394–396 (`--shadow-hard`, `--shadow-medium`, `--shadow-soft`). In `tokens/tokens.json`, `effectStyles` leave `color` unbound in `boundVariables` (noted in `docs/shadows.md`). `scripts/build-tokens.js` lines 547–551 converts `style.color` directly into raw `rgb()`. `scripts/check-tokens.js` allows `rgb()` inside `--shadow-*` role definitions, so it does not flag this line.
- **Why it matters:** If `--primitive-primary-20` changes, the shadows stay brown until `effectStyles[].color` is manually updated and the build is rerun.
- **Fix:** Resolve each `shadow/*/color` alias and emit a token reference, using each shadow's own opacity (30%, 20%, 16%), for example `color-mix(in srgb, var(--primitive-primary-20) 30%, transparent)`.

## 6. Cramped 3-column spec grid inside the 2-column layout at 840px and up — Open
- **What it is:** `.specs-grid` switches to 3 columns at `600px` and stays at 3 columns when `.product-layout` splits into a 2-column layout at `840px`, where card padding also increases to `24px`.
- **Where:** `src/style.css` lines 298–302 (`.specs-grid` 3 columns at `600px`), combined with lines 96–103 (`.product-layout` 2 columns at `840px`) and `styles/tokens/roles.css` line 308 (`--spacing-component-card-padding: var(--primitive-space-300)`, which is `24px` at `840px`).
- **Why it matters:** At about `900px`, each card is roughly `115px` wide with `24px` padding per side, so labels and values wrap badly.
- **Fix:** Drop `.specs-grid` back to 2 columns inside the `840px` two-column layout until the details column is wide enough (such as `1200px+`) for 3 cards.

## 7. Contact destinations are placeholders pending the owner's number — Open (owner input)
- **What it is:** `"Order on WhatsApp"` and `"Call the shop"` now use the correct `wa.me` and `tel:` schemes, but the destination is the explicit placeholder `REPLACE_WITH_OWNER_NUMBER`. The page also shows a visible note that the links are placeholders.
- **Where:** `src/index.html` lines 120–123. Both links have descriptive `aria-label` values and `aria-describedby="contact-pending"`; the note at line 123 states that the number is pending owner confirmation. The phone number is not exposed as ordinary text.
- **Why it matters:** The owner requires the number not to be public; the actual number was not supplied in this reconciliation. A real `wa.me`/`tel:` destination is still outstanding, and a placeholder must not be mistaken for a working contact route.
- **Fix:** Replace `REPLACE_WITH_OWNER_NUMBER` in both links with the owner-provided number when supplied, keep the number out of visible text, and remove the pending note. Do not commit an invented number.

## 8. Documentation and evidence gaps — Open (reduced)
- **What it is:** The original build-agent transcript for Prompt 1 was not saved, and `evidence/08-agent-typography-answer.txt` contains only the price element snippet rather than the full written answer. `README.md`, the Figma variables/text-style evidence, and the actual 400% browser-zoom/full-Yoruba evidence were added during reconciliation, reducing the gap.
- **Where:** `docs/prompts.md` Prompt 1/4; `evidence/08-agent-typography-answer.txt`; `README.md`; `evidence/Figma variables panel evidence.png`; `evidence/Figma text-effect style evidence.png`.
- **Why it matters:** The assessment requires the agent's written typography answer and a four-minute task README. The README now exists; the full typography-answer transcript remains an evidence gap.
- **Fix:** Ask the agent again in writing and save the full answer with class and line number; keep the missing build transcript transparent rather than fabricating it. The optional walkthrough is still unrecorded.

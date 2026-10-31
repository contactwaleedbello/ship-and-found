# Business-context reconciliation — DG Tech Store

Recorded: 2026-10-31
Source: Owner-provided responses supplied directly for this reconciliation. This is not a WhatsApp transcript; no verbatim messages, message timestamps or screenshots were provided. `docs/owner-answers.txt` is the source record.

## 1. Confirmed facts incorporated

| Area | Confirmed fact |
|---|---|
| Identity | DG Tech Store, Shop ATF 03, New Baccab Plaza (Old Kasupda Building), Ahmadu Bello Way. |
| Customers | Primary: students. Also workers and traders, including resellers. Typical age 20–35. Returning customers are important. |
| Products | Smartphones: Apple iPhone, Google Pixel, Samsung, Redmi and other brands. Laptops: Dell, HP, Apple MacBook, Lenovo and other brands. The business sells smartphones and laptops generally; it is not limited to the named brands. |
| Behaviour | Customers commonly contact the shop on WhatsApp or by phone before visiting. |
| FAQs | 1) Is the product available? 2) What is the current price? 3) Does it have good battery life? |
| Battery | Battery life matters because electricity is inconsistent and some customers avoid power banks. Product information should make battery specifications easy to find; no performance claims should be invented. |
| Purchasing pattern | New university students often start with lower-end laptops; some return for higher-performance laptops as needs develop. This is an observed pattern, not a universal rule. Discovery should support entry-level, mid-range, higher-performance and upgrading customers. |
| Languages | English and Hausa are primary; a Yoruba-speaking co-owner receives orders in Yoruba. A full three-language interface is not confirmed, implemented or claimed. |
| Connectivity | Generally average. Customers are comfortable with smartphones and laptops. Design for reasonable loading and responsive behaviour without over-simplifying. |
| Pricing | Prices change slightly with exchange rates. Support updates and avoid implying prices are permanently fixed. |
| Warranty/payment | Two-day warranty; faulty devices must be returned within that period; physical damage excluded; part payment not accepted. Communicate clearly where relevant. |
| Contact | WhatsApp and phone. Both should be prominent actions. The phone number must not be exposed as ordinary public text. |
| Desired experience | Trusting, fast and reliable. |

## 2. Design implications and decisions

1. **Product discovery and category navigation.** A full catalogue is outside Task 1. The existing card, chip, spec-grid and status patterns can carry category, brand and tier fields. The current screen remains one labelled sample product. No fake catalogue was added.
2. **Availability and price.** The page no longer claims "In stock". It shows "Availability on request" and a sample price with "confirm today's price" and an exchange-rate note. This reflects the two most frequent enquiries without pretending the sample is live stock or a fixed price.
3. **Battery hierarchy.** Battery is the first specification card, is named in the top strip, and is explained in the product description. No battery performance claim was added; the page shows capacity only and asks the customer to confirm details.
4. **Entry-level to high-performance laptops and returning customers.** Documented in the brief and here; no catalogue UI was invented for Task 1. The existing product-card/spec patterns can be reused for tiers and upgrades when the catalogue task exists.
5. **Contact actions.** WhatsApp and Call use `wa.me` and `tel:` schemes, but the destination is the explicit `REPLACE_WITH_OWNER_NUMBER` placeholder. A visible note and `aria-describedby` explain that the number is pending. No number or WhatsApp account was invented.
6. **Warranty and payment.** The page now states the two-day faulty-device return, physical-damage exclusion and no-part-payment rule in the status, trust lines, warranty card and note box. The previous 12-month warranty and "Pay on delivery" claims were removed.
7. **Typography and readability.** Fira Sans and Noto Sans are now self-hosted as text subsets. Actual 400% browser zoom was verified in Brave 153.1.95.102; the full ten-combination Yoruba set and Hausa/Naira test render without clipping or overlap. Noto Sans is declared at weight 400 only; bold fallback may be synthesised, but the required glyphs are in Fira Sans. The Figma text/effect styles and variables panel are captured in the new Figma evidence images.
8. **Responsive behaviour.** The product screen was checked at a 360px viewport: `scrollWidth` equals `clientWidth` (360), no horizontal overflow. The known 600/840 media-query and missing 1200/1600 layout defects remain documented; no redesign was attempted.
9. **Connectivity and performance.** The page is static and has no product images (the photo box is a placeholder). The font text subsets total about 70KB for the four Fira weights plus about 11KB for Noto fallback; the browser loads only the weights/subset used through `unicode-range`. `font-display: swap` is set. No external font request or new dependency was introduced. This was a proportionate improvement, not a redesign.
10. **Language and support.** The interface remains English. Hausa/Yoruba glyph coverage is preserved and verified; the page does not claim a working multilingual UI. The owner/customer languages are documented for future support content.

## 3. Implementation changes

| File | Change |
|---|---|
| `docs/business-brief.md` | Rewritten around confirmed facts, ≤400 words (400). Adds the three FAQs, battery, progression, returning customers, connectivity, pricing, warranty/payment, contact and desired experience. |
| `docs/owner-answers.txt` | Replaced the template/placeholder with an owner-provided context record. States that it is not a WhatsApp transcript and lists outstanding inputs. |
| `src/index.html` | Corrected name to DG Tech Store; removed unsupported alias, discount, dispatch, guarantee, 12-month warranty, pay-on-delivery and marketing claims; added two-day warranty, no-part-payment, availability-on-request, sample labels, battery-first specs, contact placeholders and pending note. |
| `src/style.css` | Changed status pill/availability colours to neutral roles; changed reserved discount badge from error to tertiary; added price-note/contact-note styles; added tabular figures to the price. |
| `styles/fonts.css`, `styles/fonts/` | Added self-hosted Fira Sans 400/500/600/700 and Noto Sans 400 text subsets, OFL licences and `@font-face` rules. |
| `docs/divergences.md` | Owner-provided source wording; self-hosted font finding; 400% verification; display-spacing comparison paragraph; scope note that the UI is English. |
| `docs/type-scale.md` | Per-style family note, self-hosted font note, corrected line-height rationale, tabular-figure note. |
| `docs/colour-roles.md` | Removed the unsupported "receipt photo is in my evidence" claim. |
| `docs/defects.md` | Updated resolved/current defects and line references; added the sample-data and evidence-gap items; contact placeholder is now an owner-input item. |
| `docs/interview-answers.md` | Q1 nine palettes; Q7 current semantic/line references; Q9 final-page note; Q10 type-scale wording and trade-off framing; Q11 per-shadow opacity. |
| `docs/prompts.md` | Removed the broken build-transcript reference; recorded the missing transcript as a gap; updated Prompt 3/4 notes. |
| `README.md` | Added the missing repository/task README with the seven required sections, status, stack, commands, env vars, non-goals, known defects, task summary and evidence map. |
| `evidence/glyph-test.html` | Reproducible, responsive 360px-below typography verification page with the full Hausa, ten-combination Yoruba and Naira sets. |
| `evidence/glyph-test-hausa-yoruba-400.png` | Equivalent 360 CSS-pixel viewport rendered at device pixel ratio 4; not actual browser zoom (retained as historical evidence). |
| `evidence/glyph-test-browser-zoom-400-hausa.png`, `evidence/glyph-test-browser-zoom-400-hausa-page.png`, `evidence/glyph-test-browser-zoom-400-yoruba.png`, `evidence/glyph-test-browser-zoom-400-naira.png` | Actual 400% browser-zoom window captures (zoom bubble, URL) plus a full-Hausa page capture; full Yoruba and Naira. |
| `evidence/glyph-test-browser-zoom-400.txt` | Browser/version/date/metrics for the actual 400% browser-zoom test. |
| `evidence/glyph-test-320.txt` | 320px responsive test-frame measurements, no overflow. |
| `evidence/10-screen-with-system.png` | Retaken after reconciliation at a 360px viewport. |
| `evidence/responsive-360-900-1200.txt` | Canonical iframe and headless viewport width measurements (360, 900, 1200px) with browser/version/date/DPR; not zoom evidence. |
| `evidence/Figma variables panel evidence.png`, `evidence/Figma text-effect style evidence.png`, `evidence/Hausa letters — Ƙƙ and Ƴƴ comparison.png`, `evidence/Stacked diacritics — two-line line-height specimen.png` | New Figma/design evidence captures: variables collections and counts, 15 text styles and 3 effect styles (renamed from `:` to `-` for Windows portability), Hausa glyph comparison and two-line diacritic specimen. |
| `docs/reconciliation.md` | This audit trail. |

## 4. What was preserved

- All 382 token variables, six collections, 39 colour roles, 47 documented contrast pairs, 15 type styles, 75 typography variables, three shadows, spacing and shape roles.
- The generated CSS layer and build/check scripts; no token values were changed.
- The product-screen component architecture, role-token-only rule, `type-*` classes and spacing/radius/shadow usage.
- The deliberate regression evidence and its unmerged commit; the old screenshot remains a historical token-referencing proof.
- The before/after evidence `09` (baseline) and the original prompt/reply evidence, which are historical process records.

## 5. Confirmed / derived / technical / unverified

**Confirmed owner information:** the facts in section 1 and `docs/owner-answers.txt`.

**Design decisions derived from it:** availability/price/battery hierarchy; sample-data labelling; warranty/payment placement; contact placeholders; English-first with glyph coverage; no catalogue UI in Task 1.

**Technical implementation facts:** build/checker results, font files/subset sizes, browser 360px overflow check, actual 400% browser-zoom screenshot/metrics, token counts and no-phone-text check. Noto Sans is declared at weight 400 only; bold fallback may be synthesised; the required glyphs are in Fira Sans.

**Unverified or outstanding:** actual WhatsApp/phone number; production catalogue, stock, prices and specifications; whether "Gadget Plug" is still a valid alias; Figma content access from this environment (a view link has been supplied; it is not independently authenticated here, while the variables/text-style panels are captured); full written agent typography answer; original Prompt 1 agent transcript; optional walkthrough; commit/push state. The repository is public as of 2026-10-31, but remote `main` is still `30b18e7` and the current working tree is uncommitted.

## 6. Testing performed

| Check | Command / method | Result |
|---|---|---|
| Token build | `node scripts/build-tokens.js` in a temporary copy | Exit 0; 382 read, 603 written; `primitives.css`, `roles.css`, `index.css` byte-identical to the committed files. |
| Token checker | `node scripts/check-tokens.js` | Exit 0; 5 files scanned; no disallowed raw hex/rgb/hsl or primitive references. |
| Raw values in `src/` | `grep -rnE '#[0-9a-fA-F]{3,8}\\b|rgba?\\(|hsla?\\(' src` | No matches. |
| Primitive references in `src/` | `grep -rn 'var(--primitive' src` | No matches. |
| Responsive 360px | iframe at 360px, `documentElement.clientWidth/scrollWidth` | 360 / 360; no overflow; page height 1914px (iframe method; not zoom). |
| Responsive glyph page at 320px | iframe at 320px, glyph test page | 320/320 document width; display blocks 288/288; no horizontal overflow; responsive below 360px verified. |
| Responsive 900px / 1200px | iframes at 900px and 1200px, `clientWidth/scrollWidth` | 900/900 and 1200/1200; no horizontal overflow. The known 3-column spec-grid cramping at ~900px and the missing max-width/1200–1600 layout rules remain documented in `evidence/responsive-360-900-1200.txt` and `docs/defects.md`. |
| 400% glyphs | Headful Brave at actual 400% UI zoom; `evidence/glyph-test-browser-zoom-400-*.png` and `.txt` | `innerWidth=360`, `devicePixelRatio=4`, `visualViewport.scale=1`, `clientWidth=scrollWidth=360`; Fira Sans; all ten Yoruba combinations two-line, Hausa and Naira; no clipping/overlap. The earlier 1440×4000 image is retained as historical evidence (Equivalent 360 CSS-pixel viewport rendered at device pixel ratio 4; not actual browser zoom). |
| Page assets | Static server + `curl` | 200 for `src/index.html`, `src/style.css`, `styles/fonts.css`, a font file, `styles/tokens/index.css` and the glyph test. |
| Contact links | `grep -nE 'wa\\.me|tel:|REPLACE_WITH' src/index.html` | `wa.me/REPLACE_WITH_OWNER_NUMBER` and `tel:REPLACE_WITH_OWNER_NUMBER`; visible pending note; no real number. |
| Phone-number exposure | `grep -rnE '\\+?234[0-9]{8,}|0[789][01][0-9]{8}' src docs README.md` | No phone number found. |
| Placeholder/outdated claims | grep for `Igbo`, `PROVISIONAL`, `TO WRITE YOURSELF`, `YOUR REASON`, `YOUR ANSWER` | No unsupported current business/design claims; the marker terms appear only in this test description, historical prompts/evidence, and defect "what was removed" lists. |
| Business brief length | whitespace word count | 400 words (limit 400). |

**Token-export divergence (`evidence/05-tokens-incomplete.json` vs `evidence/06-tokens-complete.json`).** Inspecting both JSON files shows that `05-tokens-incomplete.json` (252 lines, 6,965 bytes) exported only `meta` (`includes: "text styles and effect styles only"`), 15 `textStyles` (`type/display-large` through `type/label-small`) and 3 `effectStyles` (`shadow/hard`, `shadow/medium`, `shadow/soft`). It omitted the entire `variables` object (all 6 variable collections and all 382 variables: `Primitives` 182, `colour roles` 39, `typography` 75, `spacing roles` 44, `shape roles` 21, `shadow roles` 21). The omission was identified by inspecting the top-level keys (`meta`, `textStyles`, `effectStyles` with no `variables` key), observing that `textStyles[].boundVariables` referenced `{typography:*}` variables (`size`, `line-height`, `letter-spacing`) that did not exist in the file, and noting that `scripts/build-tokens.js` requires `variables.collections[]` and exits with an error without it. Re-running the extraction to include `variables.collections` produced `evidence/06-tokens-complete.json` (3,193 lines, 65,125 bytes, copied to `tokens/tokens.json`), which retains the exact same 15 `textStyles` and 3 `effectStyles` and adds all 6 variable collections (382 variables) required to generate the 603 CSS declarations in `styles/tokens/`.

**Raw-search transcript investigation.** The committed 1,993-line transcript in `HEAD` was produced before the repository restructure and included binary screenshot matches, stale nested Design System and Evidence copies, and the transcript itself recursively. The current canonical transcript `evidence/07-raw-value-search.txt` excludes binary images/fonts and self-matches while including all text matches in the current working tree. Raw values in `tokens/tokens.json`, `evidence/05-tokens-incomplete.json` and `evidence/06-tokens-complete.json` are expected source/export exceptions; the `src`-only searches are empty and `scripts/check-tokens.js` passes. The reduction is structural, not omitted intended output.

## 7. Assessment impact

This reconciliation strengthens Task 1 by aligning the brief and screen with confirmed business facts, removing unsupported sales claims, making battery/availability/price hierarchy explicit, documenting the laptop/returning-customer pattern, preserving glyph support with self-hosted fonts, documenting the token-export divergence, and adding the missing README and Figma evidence.

It does not by itself complete Task 1. Still outstanding: the full written agent typography answer (`evidence/08-agent-typography-answer.txt`), the original Prompt 1 agent transcript, a committed/pushed final repository state (the repository is public, but remote `main` is still `30b18e7`), verification of Figma content access (the owner supplied `https://www.figma.com/design/Nh1cw8CbrXHXCpzwraF3DD/Untitled?node-id=0-1&t=Ydgj0UC7KZyLpgRn-1`, but the content is not independently authenticated from this environment; the variables/text-style panels are captured), and the optional walkthrough. Those are listed in `README.md` and `docs/defects.md`.

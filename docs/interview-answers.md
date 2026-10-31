# Interview answers (Task 1 design system)

## 1. How would you structure design tokens?
I split my tokens into two layers generated from `tokens/tokens.json` by `scripts/build-tokens.js`: raw values in `styles/tokens/primitives.css` and semantic roles in `styles/tokens/roles.css`, imported in that order by `styles/tokens/index.css`.

In `tokens/tokens.json`, six collections hold 382 variables in total:
- `Primitives`: 182 variables in total—140 colour tones across nine palettes, 21 spacing steps, 10 corner radii, 5 border widths, and 6 elevation levels (`--primitive-*`).
- `colour roles`: 39 `--color-*` roles across two modes (`Light` and `Dark`).
- `spacing roles`: 44 variables across five breakpoint modes (`Compact`, `Medium`, `Expanded`, `Large`, `Extra-large`), emitting 41 `--spacing-*` properties per mode and using the 3 `breakpoint/*` variables for `@media` rules.
- `shape roles`: 21 `--radius-*` and `--border-width-*` aliases.
- `shadow roles`: 21 variables in JSON, with 3 `--shadow-*` variables emitted from `effectStyles`.
- `typography`: 15 text styles, each emitting 5 `--type-*` variables and one `.type-*` utility class.

Application code in `src/index.html` and `src/style.css` uses role variables only, never `--primitive-*` or raw hex values, enforced by `scripts/check-tokens.js`.

See: `tokens/tokens.json`, `scripts/build-tokens.js`, `styles/tokens/primitives.css`, `styles/tokens/roles.css`.

## 2. When is a token change breaking?
A token change is breaking when it breaks the build script, fails the token checker, or silently breaks visual sync on the page.

First, `scripts/build-tokens.js` exits with code 1 (`fail()`) if an alias in `tokens/tokens.json` points to a collection or variable name that was renamed or deleted, or if a required collection, mode (`Light`, `Dark`, `Compact`), `breakpoint/min-width`, or expected shadow style (`shadow/hard`, `shadow/medium`, `shadow/soft`) is missing.

Second, `scripts/check-tokens.js` exits with code 1 if a role in `styles/tokens/roles.css` is replaced with a raw hex value instead of a `var(--primitive-*)` alias. In my regression test, changing `--color-primary` to `#C4452B` failed on line 5 of `styles/tokens/roles.css` and left primary elements orange-red when the primary palette changed to blue.

Third, changing `breakpoint/min-width` or `primary/20` (`#640D00`) in `tokens/tokens.json` silently breaks the UI because `src/style.css` hard-codes the `600px` and `840px` media queries and `styles/tokens/roles.css` writes the shadow colour as a raw `rgb(100 13 0 / ...)` literal.

See: `scripts/build-tokens.js`, `scripts/check-tokens.js`, `docs/regression.md`, `docs/defects.md`.

## 3. Multiple brands and themes?
For themes, the `colour roles` collection in `tokens/tokens.json` has two modes—`Light` and `Dark`—that point to different tones in the same 14-tone HCT palettes. In `Light` mode, `primary` uses tone 40 (pinned to `#C4452B`) while the other key fills sit at their real HCT tones from 24 to 44, and containers use light tones 90 to 99. `Dark` mode swaps those roles to tone 80 for fills and tones 20 to 30 for containers. `scripts/build-tokens.js` writes `Light` on `:root` and `Dark` on `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`, so `src/style.css` needs no dark-mode rules of its own.

For rebranding a single product, my regression test showed that swapping the 14 `Primitives/primary/*` tones in `tokens/tokens.json` and rebuilding `styles/tokens/` updates every properly aliased role at once. My repo only models one shop (`DG Tech-Store`), so to support multiple brands at the same time I would add a mode per brand on the `Primitives` collection without changing the role names in `src/style.css`.

See: `docs/colour-roles.md`, `styles/tokens/roles.css`, `docs/regression.md`.

## 4. Can tokens guarantee accessible contrast?
No. Tokens cannot guarantee accessible contrast on their own if a role is used for the wrong job or paired with the wrong surface.

In `docs/colour-roles.md`, I checked all 39 colour roles and found several token pairs that fail WCAG minimums if misused:
- `warning` (`#F5B301`, tone 77) on `surface` (`#FCF9F8`, tone 98) in Light mode scores only 1.77:1, which fails both the 3:1 icon/fill minimum and the 4.5:1 text minimum.
- Container fills (`*-container`) on `surface` score between 1.23:1 and 2:1, so they are decorative fills only and cannot be used as text colours.
- `outline-variant` on `surface` scores 1.63:1 in Light mode and 1.99:1 in Dark mode, which is too low for a 3:1 input border.
- Mixing unpaired roles—such as putting white text on `primary-container` or dark text on `primary`—also fails contrast.

Tokens only keep contrast safe when each role is paired with its matching `on-*` role and used according to the rules in `docs/colour-roles.md`.

See: `docs/colour-roles.md`.

## 5. How do you make sure contrast guidelines are met?
In `docs/colour-roles.md`, I used four steps to meet the 4.5:1 minimum for text and the 3:1 minimum for icons, fills, and field borders:

First, I tested the sampled brand colours before building the palettes. The orange-red sampled from the shop's sales receipt (`#CA5E4C` to `#D05336`) scored only 4.0:1 to 4.2:1 against white text, below 4.5:1. I darkened and pinned `primary/40` to `#C4452B`, which scores 4.96:1 with white (`#FFFFFF`).

Second, I generated HCT tonal palettes where tone distance controls contrast: tones 50 and 98 give at least 3:1 (about 4.3:1 in my palettes), and tones 30 and 98 give at least 7:1 (about 8.9:1).

Third, I computed the exact WCAG contrast ratio from the hex values for every intended pair across both Light and Dark modes.

Fourth, where a pair fell below the threshold, I wrote explicit usage rules: `warning` (1.77:1 on Light `surface`) is restricted to a fill paired with `on-warning` (9.25:1), warning text on a surface uses `on-warning-container` (8.93:1 Light, 14.37:1 Dark), and field borders use `outline` (4.28:1 Light, 5.89:1 Dark) instead of `outline-variant` (1.63:1).

See: `docs/colour-roles.md`, `evidence/01-palette-before-pin.png`, `evidence/02-palette-after-pin.png`.

## 6. WCAG levels A, AA and AAA?
WCAG groups accessibility requirements into three conformance levels: A, AA, and AAA.

- **Level A** is the minimum baseline (such as keyboard access and text alternatives for images), without which assistive technology users are blocked from using the page. It sets no colour-contrast minimum.
- **Level AA** is the standard target for production web pages. It requires at least 4.5:1 contrast for normal text, 3:1 for large text, and 3:1 for non-text UI components, icons, and input borders.
- **Level AAA** is the highest level, requiring 7:1 for normal text and 4.5:1 for large text.

In `docs/colour-roles.md`, I designed and tested my palette to pass the Level AA thresholds: 4.5:1 for all text pairs (for example, `on-primary` on `primary` is 4.96:1 after pinning `#C4452B`) and 3:1 for fills, icons, and `outline` borders (4.28:1 in Light mode and 5.89:1 in Dark mode). Many of my container and surface text pairs—such as `on-surface` on `surface` at 16.61:1 Light and 14.42:1 Dark, and `on-*` on `*-container` at 7.2:1 to 7.26:1—also clear the 7:1 AAA ratio.

See: `docs/colour-roles.md`.

## 7. Why does semantic HTML matter for accessibility?
Semantic HTML gives browsers, screen readers, and keyboard users the role, hierarchy, and behaviour of each element without extra JavaScript. Landmarks let screen-reader users jump straight to page regions, headings (`<h1>` to `<h3>`) build a navigable outline, and native interactive elements handle focus and keyboard activation.

In `src/index.html`, the page uses:
- Landmarks: `<aside aria-label="Announcement">` (line 13), `<header>` (20), `<main>` (33), and `<footer>` (129). There is no `<nav>` element because this is a single product screen with no site navigation.
- Headings: one `<h1>` for the store name (`DG Tech Store`, line 23), an `<h2>` for the phone title (`Samsung Galaxy A15, 128GB`, line 58), and `<h3>` headings for `About this phone` (78) and `Key specifications` (84).
- Inline semantics: `role="img"` with `aria-label` describes the sample photo placeholder (line 37).
- Actions: `"Order on WhatsApp"` and `"Call the shop"` (lines 120–121) are `<a>` links using `wa.me` and `tel:` schemes. The destinations are explicit `REPLACE_WITH_OWNER_NUMBER` placeholders pending owner input, with `aria-label` and a visible note.

See: `src/index.html`.

## 8. How do you handle Figma handoff to developers?
I hand off generated role tokens and an automated check script rather than manual redlines or raw hex values.

First, in Figma, I keep raw values in the `Primitives` collection, which is hidden from pickers (`docs/spacing-system.md`), and expose only semantic collections (`colour roles`, `spacing roles`, `shape roles`, `shadow roles`, `typography`), 15 `type/*` text styles, and 3 `shadow/*` effect styles.

Second, I read the variables and styles out of Figma using a script through the Figma Plugin API (not an installed export plugin) and assemble them into `tokens/tokens.json`.

Third, `scripts/build-tokens.js` reads `tokens/tokens.json` and generates `styles/tokens/primitives.css`, `styles/tokens/roles.css`, and `styles/tokens/index.css` with zero hand-typed values. Every role in `styles/tokens/roles.css` is written as a `var(--primitive-*)` alias, and breakpoint `@media` blocks come straight from `breakpoint/min-width`.

Fourth, developers and agents run `node scripts/check-tokens.js`, which scans `src/` and `styles/` and fails with exit code 1 if any interface file uses a `#hex` colour, `rgb()`/`hsl()`, or `var(--primitive-*)`. I pair the code with `docs/` so rules like contrast pairs and divergences are explicit.

See: `tokens/tokens.json`, `scripts/build-tokens.js`, `scripts/check-tokens.js`, `docs/spacing-system.md`.

## 9. Why do AI interfaces look generic, and what do you give an agent to stop it?
When an AI agent has no design system, it falls back on generic training defaults and invents its own colours, spacing, and sales claims. In Prompt 2 (`evidence/09-screen-without-system.txt`), I ran the agent in an empty folder outside the repo. It produced a generic dark-navy page with cyan, green, and amber accents, missed the shop's `#C4452B` orange-red completely, made the `"Order on WhatsApp"` button look cut off at the right edge at 360px in the screenshot (`evidence/09-screen-without-system.png`), and invented `₦200,000`, `"Save ₦15,000"`, and dispatch promises.

To stop it in Prompt 3 (`evidence/10-screen-with-system.txt`), I gave the agent four things:
- A pre-built token entry stylesheet (`styles/tokens/index.css`) that it was forbidden to edit.
- A strict allow-list of role variables (`--color-*`, `--spacing-*`, `--radius-*`, `--border-width-*`, `--shadow-*`, `.type-*`) and a ban on raw hex, `rgb()`, `hsl()`, `--primitive-*`, and raw pixel numbers.
- An instruction to stop and report any missing token rather than inventing a value.
- A mandatory `node scripts/check-tokens.js` verification step before finishing.

The final reconciled page removes the unverified sales claims and labels the remaining product data as sample; the baseline screenshot remains historical, while `evidence/10-screen-with-system.png` is the current screen.

See: `docs/prompts.md`, `evidence/09-screen-without-system.png`, `evidence/10-screen-with-system.png`, `evidence/10-screen-with-system.txt`.

## 10. Why that exact line height for display large, and not one step either side?
In `docs/type-scale.md`, `display-large` has a font size of 57px and a line height of 80px. That comes from multiplying 57px by the 1.4 heading multiplier (`57 × 1.4 = 79.8`, rounded to the nearest whole pixel, 80px).

My type scale defines three line-height multipliers across the 15 styles: 1.4 for display, headline, and `title-large`; 1.5 for smaller titles, `body-small`, and labels; and 1.6 for reading text (`body-large` and `body-medium`).

I did not go lower toward the Material 3 default of 64px (a 1.12 ratio) because the owner-provided responses (`docs/owner-answers.txt`) say that alongside English and Hausa, a Yoruba-speaking co-owner receives orders in Yoruba, where tone marks and sub-dots (`ẹ́`, `ẹ̀`, `ọ́`, `ọ̀`, `ṣ`) sit above and below letters and collide when leading is tight.

The next multiplier steps, 1.5 (86px) and 1.6 (91px), would give large display type more relative leading than it needs, and even at 80px, two lines of `display-large` take 160px of vertical height and eat too much of a 360px phone screen.

See: `docs/type-scale.md`, `docs/divergences.md`.

## 11. What in your own token structure would you build differently?
I would change two parts of my token build that are listed in `docs/defects.md`, and each comes with a trade-off.

First, in `styles/tokens/roles.css` (lines 394–396), the three shadows emit a raw colour (`rgb(100 13 0 / ...)`) read from `effectStyles` in `tokens/tokens.json`, while `scripts/build-tokens.js` (line 761) skips all 21 per-variable tokens in `shadow roles`, including `shadow/*/color` (`{Primitives:primary/20}`). If `--primitive-primary-20` changes, the shadows stay brown. I would update `scripts/build-tokens.js` to resolve `shadow/*/color` and emit `color-mix()` using each shadow's own opacity (30%, 20%, 16%). The cost is that `color-mix()` is more complex CSS than a plain `box-shadow` string and no longer mirrors Figma's unbound `effectStyles` export one-for-one.

Second, `scripts/build-tokens.js` skips the `breakpoint/*` variables as tokens because standard CSS `@media` queries cannot read `var(--...)`, which forced `src/style.css` (lines 96, 298, 344) to hard-code `840px` and `600px`. I would generate the `@media` queries in `src/style.css` from `tokens/tokens.json` during the build. The cost is adding a build step for application CSS, so `src/style.css` is no longer plain hand-edited CSS.

See: `docs/defects.md`, `docs/shadows.md`, `scripts/build-tokens.js`, `styles/tokens/roles.css`.

## 12. The wrong-answer analysis: “I exported the hex values from Figma into a CSS file, so that’s a single source of truth.”
A flat CSS file of exported hex values is not a single source of truth because it throws away the alias layer between primitive palette tones and semantic roles.

In my system, `styles/tokens/primitives.css` holds the 182 raw values, `styles/tokens/roles.css` maps 39 colour roles to `var(--primitive-*)` aliases for Light and Dark modes, and `src/style.css` consumes only role variables. My regression test in `docs/regression.md` proved why this matters: when I replaced the `{Primitives:primary/40}` alias on `--color-primary` with the raw hex `#C4452B` and shifted the `Primitives/primary/*` palette to blue, `--color-primary-container` updated to blue while `--color-primary` stayed stuck on `#C4452B` (`evidence/11-broken-referencing.png`).

By month four in a real product, flat hex exports mean developers copy hex codes into new components, nobody can tell whether `#C4452B` means a brand action, a price, or an error badge, and a palette or dark-mode update misses half the UI. Even in my own setup, `tokens/tokens.json` is a point-in-time snapshot extracted from Figma (`2026-10-23`), so it can still drift from Figma unless the extraction and `scripts/build-tokens.js` are re-run whenever Figma changes.

See: `docs/regression.md`, `tokens/tokens.json`, `scripts/build-tokens.js`, `scripts/check-tokens.js`.

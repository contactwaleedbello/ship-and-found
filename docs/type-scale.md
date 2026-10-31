# Type scale

Source: M3 "Type scale tokens" page (read three times, baseline values identical each pass). Font: Fira Sans (chosen for ₦, Hausa ɓɗƙ, Yoruba ẹọṣ, tone marks, tabular numbers per `docs/business-brief.md` and `docs/owner-answers.txt`). Noto Sans is the fallback for characters outside Fira Sans; it is declared at weight 400 only, so bold fallback may be synthesised. The required Hausa/Yoruba/Naira glyphs are verified in Fira Sans. Both are self-hosted in `styles/fonts.css` as text subsets covering the page copy plus the Hausa, Yoruba and Naira glyphs; the page links that stylesheet before the token CSS.

All 15 styles use the same family stack, `"Fira Sans", "Noto Sans", system-ui, sans-serif`; the per-style `fontFamily` is also recorded in `tokens/tokens.json`. The price uses `font-variant-numeric: tabular-nums` so changing figures keep their columns.

Line height = size × multiplier (type-scale rule: 1.4 / 1.5 / 1.6), rounded to whole px.

| Style | Weight | Size | Mult. | Line height | Letter spacing | M3 default (Roboto) |
|---|---|---|---|---|---|---|
| display-large | 700 | 57 | 1.4 | 80 | -0.5 | 400/57/64/-0.25 |
| display-medium | 700 | 45 | 1.4 | 63 | 0 | 400/45/52/0 |
| display-small | 700 | 36 | 1.4 | 50 | 0 | 400/36/44/0 |
| headline-large | 600 | 32 | 1.4 | 45 | 0 | 400/32/40/0 |
| headline-medium | 600 | 28 | 1.4 | 39 | 0 | 400/28/36/0 |
| headline-small | 600 | 24 | 1.4 | 34 | 0 | 400/24/32/0 |
| title-large | 500 | 22 | 1.4 | 31 | 0 | 400/22/28/0 |
| title-medium | 500 | 16 | 1.5 | 24 | 0.15 | 500/16/24/0.15 |
| title-small | 500 | 14 | 1.5 | 21 | 0.1 | 500/14/20/0.1 |
| body-large | 400 | 16 | 1.6 | 26 | 0.5 | 400/16/24/0.5 |
| body-medium | 400 | 14 | 1.6 | 22 | 0.25 | 400/14/20/0.25 |
| body-small | 400 | 12 | 1.5 | 18 | 0.4 | 400/12/16/0.4 |
| label-large | 500 | 14 | 1.5 | 21 | 0.1 | 500/14/20/0.1 |
| label-medium | 500 | 12 | 1.5 | 18 | 0.5 | 500/12/16/0.5 |
| label-small | 500 | 11 | 1.5 | 17 | 0.5 | 500/11/16/0.5 |

Multiplier reasons: large display/headline text uses 1.4 because it needs less relative leading; reading text (`body-large`, `body-medium`) uses 1.6; smaller titles, labels and `body-small` use 1.5 to keep compact UI text readable. Tap targets are handled separately by `--spacing-component-target-min` (48px), not by line height.
Weights: display 700 (Bold), headline 600 (SemiBold), title-large 500 (Medium), set by you in Figma; M3 uses 400 for all of these. Sizes are unchanged from M3 (page says avoid changing size).

Figma: collection `typography` (5 variables per style), 15 text styles `type/<name>` bound to size, line height and letter spacing. The Figma text/effect styles are visible in `evidence/Figma text-effect style evidence.png`, and the display-large 57/80 specimen is `evidence/Stacked diacritics — two-line line-height specimen.png`.

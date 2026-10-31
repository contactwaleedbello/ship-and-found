# Deliberate divergences from M3 type tokens

## 1. Font family
- Default: Roboto. Choice: Fira Sans (`"Fira Sans", "Noto Sans", system-ui, sans-serif`).
- Why: The owner-provided responses say customers communicate in English and Hausa, and a Yoruba-speaking co-owner receives orders in Yoruba (`docs/owner-answers.txt`, `docs/business-brief.md`). Roboto lacks reliable coverage for the shop's content (`₦` with tabular figures, Hausa hooked letters `ɓ`, `ɗ`, `ƙ`, and Yoruba sub-dots `ẹ`, `ọ`, `ṣ` with tone marks). Fira Sans covers the required characters; Noto Sans is the fallback, declared at weight 400 only. If a missing Fira glyph falls back at 500/600/700, Noto bold may be synthesised rather than separately loaded.
- Where it fails: Fira Sans is wider than Roboto, so 360px phones fit fewer characters per line. If a glyph is outside the loaded text subsets, or the font fails to load, the browser falls back mid-word to Noto Sans or system-ui, which have different glyph widths and x-height, so mixed lines can misalign. The fonts are self-hosted in `styles/fonts.css`; this is not a claim that the interface is multilingual.
- Verification: actual 400% browser zoom was verified in Brave 153.1.95.102. `evidence/glyph-test-browser-zoom-400-hausa.png`, `evidence/glyph-test-browser-zoom-400-hausa-page.png`, `evidence/glyph-test-browser-zoom-400-yoruba.png` and `evidence/glyph-test-browser-zoom-400-naira.png` show the URL, the browser zoom bubble at 400%, and the glyphs. `evidence/glyph-test-browser-zoom-400.txt` records `innerWidth=360`, `devicePixelRatio=4`, `visualViewport.scale=1`, no horizontal overflow, and the font metrics. The earlier `evidence/glyph-test-hausa-yoruba-400.png` is retained as historical evidence (Equivalent 360 CSS-pixel viewport rendered at device pixel ratio 4; not actual browser zoom). Fira Sans renders `Ɓɓ`, `Ɗɗ`, `Ƙƙ` and `Ƴƴ` distinctly; the full ten-combination Yoruba set is visible across two lines with no clipping or overlap. The Naira sign remains close to the leading `1`, as recorded below. The Figma variables/text/effect panels are captured in `evidence/Figma variables panel evidence.png` and `evidence/Figma text-effect style evidence.png`; the 80px specimen is `evidence/Stacked diacritics — two-line line-height specimen.png`.
- Scope note: The interface is English. The owner-provided context does not confirm that a complete three-language website is required. Hausa/Yoruba glyph coverage is preserved for product names, customer messages and future localisation; the page does not claim a working Hausa or Yoruba UI.

## 2. Line heights (all 15 styles)
- Default: M3 ratios of about 1.12–1.5 (display 64/57 = 1.12).
- Choice: size × 1.4 / 1.5 / 1.6 per the type-scale rule.
- Why: Yoruba tone marks and sub-dots (`ẹ́`, `ẹ̀`, `ọ́`, `ọ̀`, `ṣ`) sit above and below letters and collide at tight leading (`docs/owner-answers.txt`, `docs/business-brief.md`).
- Where it fails: display-large becomes 80px tall, so two-line display text eats a lot of a small screen. The actual 400% verification in `evidence/glyph-test-browser-zoom-400-yoruba.png` shows all ten Yoruba combinations separated across two lines at 57/80; the lines are tight, so display text should still be used sparingly at 360px.

## 3. Display-large letter spacing
- Default: -0.25. Choice: -0.5.
- Why: Fira Sans is wider than Roboto at 57px, and -0.5px pulls large price figures together without touching.
- Where it fails: at Bold (700) weight, -0.5px leaves very little gap between the double crossbar of ₦ and a leading digit like 1 in ₦185,000, which can crowd on low-DPI screens.

Comparing `evidence/03-spacing-default.png` (default −0.25px) and `evidence/04-spacing-chosen.png` (chosen −0.5px), the chosen sample tightens the gap between the Naira sign and the leading `1`; the digits read more as one price block, while the default version is visibly looser. The trade-off is the low-DPI crowding noted above, which is why the chosen value is documented with a failure case rather than presented as universally better.

## 4. Weight of display, headline and title-large
- Default: 400 (Regular) for display, headline and title-large.
- Choice: display 700 (Bold), headline 600 (SemiBold), title-large 500 (Medium).
- Why: Heavier headings separate clearly from 400-weight body copy on small, low-brightness phone screens.
- Where it fails: M3 says heavier type needs wider letter spacing; display-large at -0.5px is both bold (700) and tight, so figures like ₦185,000 sit close together, and long Yoruba or Hausa headlines in Bold run wider and wrap sooner on 360px screens.

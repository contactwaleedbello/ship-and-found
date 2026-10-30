# Deliberate divergences from M3 type tokens

## 1. Font family
- Default: Roboto. Choice: Fira Sans.
- Why: Roboto lacks full coverage for the shop's content (Yoruba/Hausa/Igbo marks, ₦ with tabular figures); Fira Sans passed the glyph test.
- Where it fails: rare characters outside Fira Sans fall back to Noto Sans, which has different widths, so mixed lines can misalign. Fira Sans is wider than Roboto, so 360px phones fit fewer characters per line.

## 2. Line heights (all 15 styles)
- Default: M3 ratios of about 1.12–1.5 (display 64/57 = 1.12).
- Choice: size × 1.4 / 1.5 / 1.6 per the brief.
- Why: Yoruba/Igbo diacritics sit above and below letters and collide at tight leading.
- Where it fails: display-large becomes 80px tall, so two-line display text eats a lot of a small screen. Keep display to one line.

## 3. Display-large letter spacing (PROVISIONAL — decide from your own screenshots)
- Default: -0.25. Choice: -0.5.
- Why: Fira Sans is wider than Roboto at 57px.
- Where it fails: tighter spacing may crowd ₦ with digits; if the two screenshots show no visible gain, revert to -0.25 and drop this item.

## 4. Weight of display, headline and title-large
- Default: 400 (Regular) for display, headline and title-large.
- Choice: display 700 (Bold), headline 600 (SemiBold), title-large 500 (Medium).
- Why: [YOUR REASON. Draft, edit it: heavier headings separate clearly from 400 body on small, low-brightness phone screens.]
- Where it fails: [YOUR ANSWER. Draft: M3 says heavier type needs wider letter spacing; display-large at -0.5 is now both bold and tight, so digits like ₦125,500 can crowd. Long Yoruba or Hausa headlines in Bold also run wider and wrap sooner on 360px phones.]

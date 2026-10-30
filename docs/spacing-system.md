# Spacing, shape and border system

Sources read: M3 Breakpoints (overview, compact, medium, expanded, large/extra-large), Grids & spacing (grids, spacing, density), Spacing (overview, applying, tokens), Shape (corner radius scale, principles). Each read once in full this session. Facts below are marked M3 or Ours.

## What M3 says (facts)
- Five breakpoints: Compact <600, Medium 600–839, Expanded 840–1199, Large 1200–1599, Extra-large 1600+ (dp).
- Margins: Compact 16; Medium, Expanded, Large, Extra-large 24. Spacer between panes: 24 (Medium and up).
- Fixed pane: 360 (Expanded), 412 (Large, Extra-large). Side sheet max 400 (third pane, Extra-large).
- Panes: Compact 1; Medium 1 recommended; Expanded 1 or 2 (2 recommended); Large 1 or 2; Extra-large 1 to 3.
- Keep text at 40–60 characters per line.
- Spacing scale: base 8dp = space100. Tokens: space0 0, 25 → 2, 50 → 4, 75 → 6, 100 → 8, 125 → 10, 150 → 12, 175 → 14, 200 → 16, 250 → 20, 300 → 24, 400 → 32, 450 → 36, 500 → 40, 600 → 48, 700 → 56, 800 → 64, 900 → 72. Extend with the multiplier pattern (space225 = 18).
- Three categories: padding (inside), gap (between), margin (outside). Positions: vertical, horizontal, leading, trailing, top, bottom. Define padding and gaps on the parent; avoid margins on children.
- Density: 48×48 minimum target. Density steps 0, -1, -2, -3, each about 4dp less vertical padding. Density must not change automatically with breakpoint.
- Corner scale: none 0, extra small 4, small 8, medium 12, large 16, large increased 20, extra large 28, extra large increased 32, extra extra large 48, full. Optical roundness: inner radius = outer radius − padding.

## What is in Figma
**Primitives** (collection `Primitives`, hidden from pickers)
- `space/<code>`: the 18 M3 tokens plus 3 we added with the multiplier pattern: space1000 = 80, space1200 = 96, space1600 = 128.
- `radius/<name>`: the 10 M3 steps (full = 9999).
- `border/0,1,2,3,4`: Ours. M3 pages read define no border widths.

**spacing roles** (5 modes: Compact, Medium, Expanded, Large, Extra-large; 44 variables)
- Breakpoints: `breakpoint/min-width`, `max-width` (Extra-large 9999 = no limit), `design-width`.
- `layout/margin` 16/24/24/24/24 (M3), `layout/spacer` 0/24/24/24/24 (M3; Compact is single pane), `layout/fixed-pane-width`, `layout/side-sheet-max-width`, `layout/panes`.
- `section/*` gaps and vertical padding; `gap/vertical/*`, `gap/horizontal/*`, `padding/*` (xs–xl); `component/*` (button, input, form, card, list-item, dialog, chip, icon-label, app-bar, target-min 48).

**shape roles** (1 mode, 21 variables): `radius/<component>` and `border/width/*`, all aliases to primitives.

## Ours, not M3 (change freely)
- Design widths 360/768/1024/1440/1920 and column counts 4/8/12/12/12 (the grids page gives no counts).
- Every per-breakpoint value except margin, spacer, pane widths and the 48 target.
- Section spacing, app-bar height, component padding values.
- Component-to-radius mapping (button full, card medium, dialog extra large, input extra small, and so on): from memory of M3 component specs, not read this session.
- Border widths, including 3 for the focus ring (memory).
- Density is not modelled. Add it as a separate collection later, not as breakpoint modes.

## Corrections to my first version
- I had 3 breakpoint modes' worth of logic and missed Extra-large.
- I set Expanded/Large margins to 32/40. M3 says 24.
- I named primitives by px (`spacing/16`). They are now M3 names (`space/200`).

# Shadow system

## What M3 says (Elevation: overview, applying elevation, tokens; read once)
- Elevation is the distance between two surfaces on the z-axis, in dp. Six levels: 0, +1, +2, +3, +4, +5 = 0, 1, 3, 6, 8, 12 dp.
- Resting state uses levels 0–3. Levels 4–5 are for interaction (hover, dragged). Hover raises one level.
- Tokens carry no shadow and no colour. Each platform picks the shadow values. So M3 gives no x, y, blur, spread or opacity.
- A small, sharp shadow means close to the surface behind. A larger, softer shadow means more distance.
- M3 prefers tonal difference to shadows. Use visible shadows to protect elements on a busy background, or to encourage interaction. Fewer levels means more power.
- Scrim: the scrim colour role at 32% opacity.
- Surface tint is deprecated.

## Our three shadows (values are ours)
Colour: primary/20 (#640D00), at the opacity below. Not black.

| Shadow | x | y | blur | spread | opacity | M3 level it stands for |
|---|---|---|---|---|---|---|
| hard | 0 | 1 | 2 | 0 | 30% | 1 (1dp) |
| medium | 0 | 4 | 8 | 0 | 20% | 3 (6dp) |
| soft | 0 | 12 | 24 | -4 | 16% | 5 (12dp) |

Hard is small and sharp (close). Soft is large and diffuse (far). That follows the M3 rule above.

## Why a brand-coloured shadow reads differently from black — YOUR two sentences
[TO WRITE YOURSELF. Look at the two rows in the "Shadows" section: primary-based on top, black below. Say what you actually see on the white card and the warm background.]

## In Figma
- Primitives: `elevation/level-0` to `level-5` (M3 dp values).
- Collection `shadow roles`: per shadow `x`, `y`, `blur`, `spread`, `opacity`, `elevation-level` (alias to the primitive), `color` (alias to primary/20).
- Effect styles `shadow/hard`, `shadow/medium`, `shadow/soft`: offset, blur and spread are bound to the variables.

## Known gaps
- The colour is NOT bound on the styles. Binding a colour variable resets alpha to 100%, so the styles carry primary/20's RGB plus the opacity. The `color` variables exist but no style reads them. If primary/20 changes, update the styles by hand.
- Opacity is not bound either (Figma has no opacity field on shadows).
- Mapping hard/medium/soft to levels 1/3/5 is my choice. Level 5 is an interaction level in M3, so "soft" is a floating or dragged state.
- primary/20 rather than primary/40 is my choice: the pinned primary at 40 gives an orange glow. Check it by eye.

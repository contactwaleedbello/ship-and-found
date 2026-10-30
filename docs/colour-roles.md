# Colour roles

Task 1, design system. Business: the phone shop whose receipt is the source of the brand colour.

## 1. Where the brand colour came from

The brand colour comes from the logo printed on the phone shop's own sales receipt (a photo of the receipt is in my evidence). The logo has an orange-red "DG" monogram and a dark grey arc. I sampled the logo pixels and corrected for the dim photo by white-balancing against the white paper. That gave about #CA5E4C to #D05336 for the orange-red and about #726E67 for the grey arc, which is unreliable because the arc is thin. These are estimates from a compressed phone photo, not print values.

Two deliberate changes:
- Primary: I darkened the sampled orange-red to #C4452B so white text on it passes. The sampled orange scored 4.0 to 4.2 with white text, below the 4.5 minimum. #C4452B scores 4.96.
- Secondary: I set the dark arc to a true charcoal, #3A3A3A.

The other colours are my own choices, not from the logo: tertiary teal #0F766E (a cool colour that contrasts with the orange and keeps the orange free for the brand), neutral ink #1A1A1A, neutral variant #5F5A55, and the status colours success #12733A, warning #F5B301, error #B3142F, info #1F5FBF.

## 2. How the palettes were generated, and the number of tones

Method (so I can explain it): Material 3 describes a colour in three numbers, hue, chroma and tone (HCT). Tone is how light or dark a colour looks, from 0 (black) to 100 (white). A tonal palette keeps one hue and chroma and only changes tone. I took the hue and chroma of each key colour and generated its tones with Google's open-source Material Color Utilities library (version 0.3.0) through a script, then loaded the results into Figma as variables. Where a tone cannot exist at the full chroma, the library lowers the chroma (the Material page says this happens).

Tones: 14 per palette. The Material 3 page says the tones are numbered 0 to 100 in steps of 10, plus 95, 98 and 99. That is enough for light and dark from one source because dark and light themes use the same palette: light uses the mid-dark tones (about 24 to 44) for fills and the light tones (90 to 99) for containers, and dark swaps them (80 for fills, 20 to 30 for containers). Tone also decides contrast. The page's own example: tones 50 and 98 give at least 3:1, and tones 30 and 98 give at least 7:1. I checked this on every palette (about 4.3:1 and 8.9:1).

Note: the page text says 14 tones, but two of its image descriptions say 13. I followed the text.

## 3. Pinning primary 40

Primary 40 is pinned to the brand colour #C4452B. Its real HCT tone is 47.2, not 40. Without the pin, tone 40 for this hue and chroma would be #AC341B (white text 6.44:1) and the brand colour would not appear in the palette at all. With the pin, white text on it scores 4.96:1, and tones 40 and 50 (#CE4C31) are nearly the same colour.

[TO WRITE YOURSELF: one paragraph on the visible difference between your two screenshots, evidence/01-palette-before-pin.png and evidence/02-palette-after-pin.png. Only tone 40 changes, so say what you actually see.]

## 4. Extra tones beyond 14

- Key tone (one per palette except primary): the exact brand or chosen colour sits at its real HCT tone. Added so each chosen colour exists exactly. Secondary 24, tertiary 44, neutral 9, neutral variant 39, success 42, warning 77, error 38, info 42.
- Neutral surface tones: 6, 12, 17, 92, 94, 96. The Material roles page names several surface container levels, but the 14 tones only have 90, 95, 98, 99 and 100 near the light end and 0, 10, 20 near the dark end. Three distinct container levels plus a surface need steps between them. The page does not give these tone numbers in text, so the numbers are my choice.

So neutral has 21 tones, primary has 14, and the other seven palettes have 15.

## 5. Roles

A role is a job, not a colour. I used 39 roles (the Material roles page lists 26 standard ones in six groups; I added success, warning and info groups because the shop shows warranty and balance states, and I left out the add-on roles the page says most products should ignore). Contrast is WCAG ratio, computed from the hex values. Figma collection: "colour roles", modes Light and Dark, every role an alias of a tone in "key colors".

| Role | Job | Light tone | Light hex | Dark tone | Dark hex |
|---|---|---|---|---|---|
| primary | Most important actions and elements (main buttons, active states) | primary/40 | #C4452B | primary/80 | #FFB4A4 |
| on-primary | Text and icons on a primary fill | primary/100 | #FFFFFF | primary/20 | #640D00 |
| primary-container | Standout fill for key components | primary/90 | #FFDAD3 | primary/30 | #8A1B05 |
| on-primary-container | Text and icons on the primary container | primary/30 | #8A1B05 | primary/90 | #FFDAD3 |
| secondary | Less prominent fills, text and icons | secondary/24 | #3A3A3A | secondary/80 | #C8C6C6 |
| on-secondary | Text and icons on a secondary fill | secondary/100 | #FFFFFF | secondary/20 | #303030 |
| secondary-container | Quiet fill, for example tonal buttons | secondary/90 | #E4E2E1 | secondary/30 | #474747 |
| on-secondary-container | Text and icons on the secondary container | secondary/30 | #474747 | secondary/90 | #E4E2E1 |
| tertiary | Contrasting accent that balances primary and secondary | tertiary/44 | #0F766E | tertiary/80 | #80D5CB |
| on-tertiary | Text and icons on a tertiary fill | tertiary/100 | #FFFFFF | tertiary/20 | #003733 |
| tertiary-container | Accent container, for example input highlights | tertiary/90 | #9CF2E8 | tertiary/30 | #00504A |
| on-tertiary-container | Text and icons on the tertiary container | tertiary/30 | #00504A | tertiary/90 | #9CF2E8 |
| error | Error state: urgent fills, icons and text | error/38 | #B3142F | error/80 | #FFB3B3 |
| on-error | Text and icons on an error fill | error/100 | #FFFFFF | error/20 | #680014 |
| error-container | Error fill that grabs attention | error/90 | #FFDAD9 | error/30 | #920021 |
| on-error-container | Text and icons on the error container | error/30 | #920021 | error/90 | #FFDAD9 |
| success | Success state, for example warranty active | success/42 | #12733A | success/80 | #81D995 |
| on-success | Text and icons on a success fill | success/100 | #FFFFFF | success/20 | #003918 |
| success-container | Success fill | success/90 | #9CF6AF | success/30 | #005226 |
| on-success-container | Text and icons on the success container | success/30 | #005226 | success/90 | #9CF6AF |
| warning | Warning state, for example warranty expiring. Fill only (see rules) | warning/77 | #F5B301 | warning/80 | #FEBB14 |
| on-warning | Text and icons on a warning fill | warning/10 | #271900 | warning/20 | #412D00 |
| warning-container | Warning fill | warning/90 | #FFDEA5 | warning/30 | #5D4200 |
| on-warning-container | Text and icons on the warning container | warning/30 | #5D4200 | warning/90 | #FFDEA5 |
| info | Information state, for example balance note | info/42 | #1F5FBF | info/80 | #AEC6FF |
| on-info | Text and icons on an info fill | info/100 | #FFFFFF | info/20 | #002E6A |
| info-container | Info fill | info/90 | #D8E2FF | info/30 | #004395 |
| on-info-container | Text and icons on the info container | info/30 | #004395 | info/90 | #D8E2FF |
| surface | Default page background | neutral/98 | #FCF9F8 | neutral/6 | #131313 |
| on-surface | Main text and icons on any surface | neutral/9 | #1A1A1A | neutral/90 | #E5E2E1 |
| on-surface-variant | Lower-emphasis text and icons | neutral-variant/39 | #5F5A55 | neutral-variant/80 | #CDC5BF |
| surface-container-low | Low-emphasis container (cards) | neutral/96 | #F6F3F2 | neutral/10 | #1C1B1B |
| surface-container | Default container (navigation, sheets) | neutral/94 | #F0EDED | neutral/12 | #20201F |
| surface-container-high | High-emphasis container | neutral/92 | #EAE7E7 | neutral/17 | #2A2A2A |
| outline | Important boundaries such as a text-field border | neutral-variant/50 | #7C7671 | neutral-variant/60 | #96908A |
| outline-variant | Decorative dividers only | neutral-variant/80 | #CDC5BF | neutral-variant/30 | #4A4641 |
| inverse-surface | Fill that contrasts with the surrounding UI (snackbar) | neutral/20 | #313030 | neutral/90 | #E5E2E1 |
| inverse-on-surface | Text on the inverse surface | neutral/95 | #F3F0EF | neutral/20 | #313030 |
| inverse-primary | Action text on the inverse surface | primary/80 | #FFB4A4 | primary/40 | #C4452B |

## 6. Contrast of every pair I will use

Minimum: 4.5:1 for text, 3:1 for icons, fills and borders against the surface. Container and divider fills have no ratio requirement because they carry no text.

| Foreground | On | Use | Needs | Light | Dark | Result |
|---|---|---|---|---|---|---|
| on-primary | primary | text on fill | 4.5:1 | 4.96 | 7.7 | pass |
| on-primary-container | primary-container | text on container | 4.5:1 | 7.24 | 7.24 | pass |
| primary | surface | fill/icon against surface | 3:1 | 4.74 | 10.9 | pass |
| primary-container | surface | container fill, decorative only (no ratio required) | none | 1.24 | 1.98 | pass |
| on-secondary | secondary | text on fill | 4.5:1 | 11.37 | 7.76 | pass |
| on-secondary-container | secondary-container | text on container | 4.5:1 | 7.2 | 7.2 | pass |
| secondary | surface | fill/icon against surface | 3:1 | 10.86 | 10.93 | pass |
| secondary-container | surface | container fill, decorative only (no ratio required) | none | 1.23 | 2 | pass |
| on-tertiary | tertiary | text on fill | 4.5:1 | 5.47 | 7.71 | pass |
| on-tertiary-container | tertiary-container | text on container | 4.5:1 | 7.25 | 7.25 | pass |
| tertiary | surface | fill/icon against surface | 3:1 | 5.22 | 10.88 | pass |
| tertiary-container | surface | container fill, decorative only (no ratio required) | none | 1.23 | 1.99 | pass |
| on-error | error | text on fill | 4.5:1 | 6.87 | 7.73 | pass |
| on-error-container | error-container | text on container | 4.5:1 | 7.26 | 7.26 | pass |
| error | surface | fill/icon against surface | 3:1 | 6.56 | 10.93 | pass |
| error-container | surface | container fill, decorative only (no ratio required) | none | 1.23 | 1.99 | pass |
| on-success | success | text on fill | 4.5:1 | 5.93 | 7.69 | pass |
| on-success-container | success-container | text on container | 4.5:1 | 7.26 | 7.26 | pass |
| success | surface | fill/icon against surface | 3:1 | 5.66 | 10.88 | pass |
| success-container | surface | container fill, decorative only (no ratio required) | none | 1.24 | 1.98 | pass |
| on-warning | warning | text on fill | 4.5:1 | 9.25 | 7.71 | pass |
| on-warning-container | warning-container | text on container | 4.5:1 | 7.24 | 7.24 | pass |
| warning | surface | fill/icon against surface | 3:1 | 1.77 | 10.91 | FAIL, see rules |
| warning-container | surface | container fill, decorative only (no ratio required) | none | 1.23 | 1.99 | pass |
| on-info | info | text on fill | 4.5:1 | 6.09 | 7.71 | pass |
| on-info-container | info-container | text on container | 4.5:1 | 7.26 | 7.26 | pass |
| info | surface | fill/icon against surface | 3:1 | 5.81 | 10.9 | pass |
| info-container | surface | container fill, decorative only (no ratio required) | none | 1.23 | 1.98 | pass |
| on-surface | surface | text | 4.5:1 | 16.61 | 14.42 | pass |
| on-surface-variant | surface | secondary text | 4.5:1 | 6.51 | 10.91 | pass |
| on-surface | surface-container-low | text | 4.5:1 | 15.76 | 13.34 | pass |
| on-surface-variant | surface-container-low | secondary text | 4.5:1 | 6.18 | 10.09 | pass |
| on-surface | surface-container | text | 4.5:1 | 14.95 | 12.66 | pass |
| on-surface-variant | surface-container | secondary text | 4.5:1 | 5.86 | 9.58 | pass |
| on-surface | surface-container-high | text | 4.5:1 | 14.16 | 11.14 | pass |
| on-surface-variant | surface-container-high | secondary text | 4.5:1 | 5.55 | 8.43 | pass |
| outline | surface | field border | 3:1 | 4.28 | 5.89 | pass |
| outline-variant | surface | divider, decorative only | none | 1.63 | 1.99 | pass |
| inverse-on-surface | inverse-surface | snackbar text | 4.5:1 | 11.6 | 10.21 | pass |
| inverse-primary | inverse-surface | snackbar action | 3:1 | 7.72 | 3.85 | pass |
| primary | surface | used AS TEXT on surface | 4.5:1 | 4.74 | 10.9 | pass |
| secondary | surface | used AS TEXT on surface | 4.5:1 | 10.86 | 10.93 | pass |
| tertiary | surface | used AS TEXT on surface | 4.5:1 | 5.22 | 10.88 | pass |
| error | surface | used AS TEXT on surface | 4.5:1 | 6.56 | 10.93 | pass |
| success | surface | used AS TEXT on surface | 4.5:1 | 5.66 | 10.88 | pass |
| info | surface | used AS TEXT on surface | 4.5:1 | 5.81 | 10.9 | pass |
| warning | surface | used AS TEXT on surface | 4.5:1 | 1.77 | 10.91 | FAIL, see rules |

## 7. Pairs below the threshold, and the rules that follow

- warning on surface, light mode: 1.77:1. The yellow fill is too light to be text or an icon on a pale surface. Rule: warning is a fill role only. Text on it uses on-warning (9.25:1). Warning text or icons on a surface use on-warning-container, which scores 8.93:1 on the light surface (14.37:1 dark) and 7.24:1 on its own container.
- *-container on surface (1.23 to 1.99): not used for text, only as a fill behind text that uses the matching on-container role.
- outline-variant on surface (1.63 and 1.99): decorative dividers only, never a field border. Field borders use outline (4.28 and 5.89, above the 3:1 needed).
- primary on surface, light mode: 4.74:1. It passes 4.5:1 as text, with little margin.
- Never use white on the primary container or dark text on the primary fill: those are not paired roles.


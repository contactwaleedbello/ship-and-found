# accessibility-baseline

Source: PRD Sections 9.4, 3.3 FR-01, 3.1, 3.2, 9.5

## Single job

This file is the checkable WCAG 2.1 AA implementation rulebook for contrast, keyboard navigation, focus management, semantic HTML, accessible forms, equal-weight battery/price announcements, live regions, reduced motion, zoom/reflow, and accessibility testing.

## Scope

- **Customer and Visitor flows:** Full **WCAG 2.1 Level AA** compliance is required and audited (`PRD 9.4`, `13.2`), because shoppers use screen readers, keyboard navigation, and small low-contrast mobile screens in bright daylight.
- **Store Worker, Owner, and Co-owner flows:** Must follow the same semantic HTML, form label, keyboard, and color-contrast rules in code. Whether they undergo a separate formal screen-reader audit is tracked in `Unresolved before build` item 1 (`non-functional.md`).

## Contrast (`WCAG 1.4.3`, `1.4.11`, `1.4.1`)

- **Body text (`< 18pt` regular or `< 14pt` bold):** Minimum **4.5:1** contrast ratio against its background so text remains legible on low-brightness Android screens (`PRD 9.4`).
- **Large text (`>= 18pt` / `24px` regular or `>= 14pt` / `18.66px` bold):** Minimum **3:1** contrast ratio against its background.
- **UI components, form input borders, and focus indicators:** Minimum **3:1** contrast ratio against adjacent colors.
- **Never rely on color alone** to convey status, error, success, or required fields; always pair color with visible text (for example a status badge text label or inline error text) so color-blind users and monochrome displays receive the same information.

## Keyboard navigation (`WCAG 2.1.1`, `2.1.2`, `2.4.1`, `2.4.3`)

- **Every interactive control is keyboard reachable** via `Tab` / `Shift+Tab` in an order that matches the visual top-to-bottom, left-to-right reading order.
- **No positive `tabindex` values (`tabindex="1"`, etc.)**, because positive values override the DOM order and trap keyboard users in unpredictable loops. Use native interactive elements; use `tabindex="0"` only on custom interactive widgets (avoid in Version 1) and `tabindex="-1"` only for programmatic focus targets.
- **No keyboard traps:** Any modal or dialog must allow closing with `Escape` and return focus to the trigger button on close.
- **Skip link:** Render a `"Skip to main content"` link (`<a href="#main-content">`) as the first focusable element in `app/layout.tsx`, visually hidden until focused, so keyboard users can bypass repeated navigation headers.

## Focus management (`WCAG 2.4.7`)

- **Visible focus ring on every interactive element:** Minimum `2px` solid outline with at least `3:1` contrast against both the focused element and the surrounding background. Never apply `outline: none` or ` focus:outline-none` without an explicit `focus-visible:ring-2` replacement.
- **Validation error focus:** When a form submission fails validation, move keyboard focus programmatically to the first invalid input field so keyboard and screen-reader users can immediately correct it.
- **Route transition focus:** When navigating to a new page, ensure focus lands on the page `<h1>` (with `tabIndex={-1}`) or document top so screen readers announce the new screen context.

## Semantic HTML (`WCAG 1.3.1`, `4.1.2`)

- **Use native HTML elements first:** `<button>` for actions, `<a href>` for navigation, `<input>`/`<select>`/`<textarea>` for form controls, and `<header>`, `<nav>`, `<main id="main-content">`, `<footer>` landmarks on every page.
- **Never attach `onClick` to a `<div>` or `<span>`**, because non-semantic elements lack keyboard activation (`Enter`/`Space`), focusability, and screen-reader role announcements.
- **Heading hierarchy:** Exactly one `<h1>` per screen matching the screen's purpose in `screen-inventory.md`, with no skipped heading levels (`<h1>` -> `<h2>` -> `<h3>`).
- **Document language:** Set `<html lang="en">` in the root `app/layout.tsx` so screen readers select the correct pronunciation engine.
- **Lists and tables:** Use `<ul>`/`<ol>` for device grids and queues, and `<table>` with `<caption>` and `<th scope="col">` for tabular data (`Audit Log`, `Payment History`, `Reserved Units`).

## Forms and inline validation (`WCAG 3.3.1`, `3.3.2`, `PRD 3.1`)

- **Explicit `<label htmlFor="...">` on every input (`PRD 9.4`):** Placeholder text disappears on typing and fails contrast rules, so placeholders may never replace a visible `<label>`.
- **Required fields:** Mark every required field with both the HTML `required` attribute and visible text (e.g., `(Required)` or `*` with a form legend `"All fields are required"`).
- **Accessible inline errors (`PRD 9.4`):** When a field fails inline validation (on blur or submit), set `aria-invalid="true"` and `aria-describedby="<field-id>-error"` on the input, and render the exact error string from `ux-states.md` inside `<p id="<field-id>-error" role="alert">` directly below the input.
- **Explicit button types:** Every submit button uses `<button type="submit">` and every non-submit action button inside a form uses `<button type="button">` so pressing `Enter` never triggers an unintended secondary action.

## Battery life and price equal-weight pattern (`PRD 9.4`, `FR-01`)

Because electricity unreliability makes battery life a primary purchase driver equal to price (`PRD 1.4`), every device card on `Home / Inventory Listing` and the header summary on `Device Detail` must enforce both visual and screen-reader parity:

1. **DOM siblings:** Render the battery life element and the price element as direct sibling elements inside the same container—never nest one inside the other.
2. **Identical typography tokens:** Apply the exact same Tailwind font-size, font-weight, line-height, and text-color classes to both values (for example `text-lg font-bold text-slate-900`).
3. **Distinct screen-reader labels (`PRD 9.4`):** Render visible labels or explicit `aria-label` attributes so a screen reader announces them as two distinct labeled facts:
   - Battery life: `"Battery life: 12 hours"` (using `Device.battery_life_spec`).
   - Price: `"Price: ₦300,000"` (or `aria-label="Price: 300,000 naira"`).
4. **Real text only:** Never render price or battery life inside a raster/SVG image.

## Dynamic announcements, motion, and zoom/reflow (`WCAG 1.4.4`, `1.4.10`, `2.3.3`, `4.1.3`)

- **Live regions:**
  - Loading containers set `aria-busy="true"` while skeleton states from `ux-states.md` are visible.
  - Top-of-screen error banners (`ux-states.md`) use `role="alert"` (`aria-live="assertive"`) so errors are announced immediately without requiring a focus jump.
  - Status updates and clipboard copy confirmations (`"Copied template to clipboard"`) use `aria-live="polite"`.
  - Never rely on ephemeral toasts (`ux-states.md` bans toasts); all state strings must persist in the primary content area DOM so screen-reader users can review them at their own pace.
- **Reduced motion:** Respect `@media (prefers-reduced-motion: reduce)` (`motion-reduce:transition-none` in Tailwind). No auto-playing video, audio, or carousels (`working-agreements.md`).
- **Zoom and viewport reflow (`WCAG 1.4.10`, `PRD 9.5`):**
  - Customer screens must render without horizontal scrolling from `360px` viewport width (`PRD 9.5`) down to `320px` CSS pixels (equivalent to `1280px` desktop at **400% browser zoom**).
  - Never set fixed pixel widths or `overflow: hidden` on text containers that would clip wrapped text at 400% zoom.

## Testing requirements (`PRD 13.2`)

1. **Automated CI check:** Run `axe-core` against every rendered screen in automated tests. Any `critical` or `serious` violation fails the build.
2. **Manual keyboard check:** Navigate every Customer flow (`Home` -> `Device Detail` -> `Calculator` -> `Login/Register` -> `Apply` -> `Application Status` -> `Agreement Acceptance` -> `Contract Detail` -> `Account Settings`) using keyboard only (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`).
3. **Manual screen-reader check (`PRD 13.2`):** Verify `Device Detail` and `Apply for Part-Payment` with VoiceOver (macOS/iOS) or TalkBack/NVDA before Day 5 UAT.
4. **Manual 400% zoom check:** Verify `Home`, `Device Detail`, `Apply for Part-Payment`, and `Contract Detail` at 400% zoom (`1280px` viewport) with zero horizontal scroll or clipped text.

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`):

1. **Formal WCAG audit scope for Worker and Owner flows (`build-plan.md` decision 15 / `AGENTS.md` Q18):** Confirm that Worker and Owner screens apply the same code rules while formal manual screen-reader sign-off targets Customer flows (`PRD 9.4`).
2. **`axe-core` test-runner binding (`build-plan.md` decision 1):** Select `vitest-axe` or `jest-axe` once the Day 0 test framework is chosen.
3. **Manual screen-reader device assignment for Day 5 UAT:** Confirm whether VoiceOver on macOS/iPhone or TalkBack on the UAT Android device is used during Day 5 morning testing.

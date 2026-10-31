# design-system

Source: Sigma Designs frames loaded in Antigravity and the Task 1 design system artifacts.

## What this file is

This file states how the agent must consume the Task 1 design system when building any screen. It names the anti-patterns, the naming rules, and the accessibility constraints that apply to the design system itself.

It does not define tokens, colors, typography, or spacing. Those live in the Task 1 design system artifacts. If a token is not in the design system, do not invent one. Stop and ask in `.agents/rules/working-agreements.md`.

## Where the design system lives

- Frames: Sigma Designs frames loaded in Antigravity sessions.
- Tokens, components, and patterns: the Task 1 design system artifacts produced in this repository. The agent reads them before building any screen.
- These two are the only sources. Do not design from memory. Do not copy a pattern from another product.

## How to consume the design system

1. Open the frames for the screen you are building in `screen-inventory.md`.
2. Open the Task 1 design system artifacts for tokens, components, and spacing.
3. Use the design system components. Do not rebuild a component the design system already provides.
4. Use the design system tokens. Do not hardcode a color, size, or spacing value that a token expresses.
5. If the PRD is silent on a screen detail, adopt the frame layout per `AGENTS.md`. If the frame contains an element that is in `.agents/rules/out-of-scope.md` or not in `PRD 3.2`, do not build it. Log in `.agents/rules/working-agreements.md`.
6. If the frame and the design system artifacts disagree, the design system artifacts win for tokens, spacing, and typography. The frame wins for layout and elements.
7. If a design system component does not exist for the element the frame shows, stop and log in `.agents/rules/working-agreements.md`. Do not invent a component.

## Anti-patterns

Every item below is a bug. Do not do it.

- Hardcoding a color that a design system token expresses.
- Adding a color not in the design system.
- Overriding a design system component's style with custom CSS.
- Building a button, input, select, or modal that the design system already provides.
- Using a font not in the design system.
- Using a spacing value not in the design system scale.
- Copying a pattern from another product because it "looks right."
- Using an icon that is not in the design system icon set.
- Adding animation not in the design system.
- Adding a shadow, border radius, or gradient not in the design system.

## What the design system must respect

The design system is subject to the rule files. If a design system choice conflicts with a rule file, the rule file wins.

- Contrast ratios per `.agents/rules/accessibility-baseline.md` contrast section.
- Focus indicator style per `.agents/rules/accessibility-baseline.md` focus section.
- Form label and error association per `.agents/rules/accessibility-baseline.md` forms section.
- Reduced motion per `.agents/rules/accessibility-baseline.md` motion section.
- Battery life and price equal visual weight per `.agents/rules/functional-requirements.md` FR-01 and the battery-life-and-price section of `.agents/rules/accessibility-baseline.md`.
- Color is never the only signal per `.agents/rules/accessibility-baseline.md` contrast section.
- No decorative elements per `.agents/rules/working-agreements.md` minimal UX MO definition.

If a design system choice violates one of these, do not use the design system choice. Log the conflict in `.agents/rules/working-agreements.md`.

## State usage

- Every screen has one primary action per `.agents/rules/screen-inventory.md`.
- Empty, loading, and error states use the design system's state patterns if one exists. If none exists, use the closest primitive and log the gap in `.agents/rules/working-agreements.md`.
- Every string rendered on screen comes from `.agents/rules/ux-states.md`. The design system does not define strings.

## New components

If a screen requires a component not in the design system:

1. Check if a similar component exists in the design system. Prefer to adapt.
2. If no similar component exists, propose the new component in the pull request description.
3. The proposal cites the screen in `screen-inventory.md` that needs it and the rule file that constrains it.
4. Do not add the new component until the proposal is reviewed and approved.

## How to use this file

Read this file before building any screen. Open the frames for the specific screen. Open the Task 1 design system artifacts. Then build. If any step is missing, stop and log in `.agents/rules/working-agreements.md`.

# prompts.md: prompts I gave the agent, word for word

How to read this file. Each entry has the prompt, the evidence file that holds the agent's reply, and two notes:
what went wrong and what I changed. The notes are mine. Failures stay in.


---

## Prompt 1: convert tokens.json to CSS (build-tokens.js and check-tokens.js)

Where it ran: inside the project. Output: styles/tokens/*.css, scripts/build-tokens.js, scripts/check-tokens.js.
Agent reply saved in: [add the file name, or "pasted in chat"]

```
You are working in my project repo. Write a Node script that converts a design-token JSON file into CSS custom properties. Do not edit the JSON, and do not type any token value by hand. Every value in the CSS must come from the JSON.

INPUT
tokens/tokens.json (this is evidence/06-tokens-complete.json, copied in).
Shape:
- variables.collections[]: { name, modes[], variables[] }
- each variable: { name, type: "COLOR" | "FLOAT", values: { <modeName>: value } }
- a value is a number, a "#RRGGBB" string, or an alias string like "{Primitives:primary/40}" meaning collection "Primitives", variable "primary/40"
- textStyles[]: { name, fontFamily, fontStyle, fontSize, lineHeightPx, letterSpacingPx }
- effectStyles[]: { name, type: "DROP_SHADOW", color, opacity, x, y, blur, spread }

OUTPUT (in styles/tokens/)
1. primitives.css: one :root block with every variable from the "Primitives" collection, named --primitive-<name with / replaced by ->. Example: --primitive-primary-40.
2. roles.css: everything else. Every alias must become var(--...) pointing at the variable it names. Never write a hex value or a resolved number where the JSON has an alias.
   - "colour roles" (modes Light, Dark): --color-<name>. Light goes in :root. Dark goes in [data-theme="dark"], and in @media (prefers-color-scheme: dark) for :root:not([data-theme="light"]).
   - "spacing roles" (5 modes): name each --spacing-<name with / replaced by ->. The Compact mode goes in :root. Medium, Expanded, Large and Extra-large go in mobile-first @media (min-width: …px) blocks, using the values of breakpoint/min-width read from the JSON, not typed by you. Skip the breakpoint/* variables themselves as custom properties but keep their numbers in a comment above each block.
   - "shape roles": --radius-<name> and --border-width-<name>.
   - "shadow roles": skip the per-variable output. Instead emit --shadow-hard, --shadow-medium and --shadow-soft from effectStyles, each as a box-shadow value: "<x>px <y>px <blur>px <spread>px rgb(<r> <g> <b> / <opacity>)". Convert the hex in code.
   - "typography": for each of the 15 text styles emit --type-<style>-family, -weight, -size, -line-height and -letter-spacing, plus a class .type-<style> that uses them. Take weight from the typography collection's <style>/weight variable. Family stack: "Fira Sans", "Noto Sans", system-ui, sans-serif. Sizes and line heights in px.
3. index.css: @import primitives.css first, then roles.css.

THE RULE THAT MATTERS
Interface code must use role variables only (--color-*, --spacing-*, --radius-*, --border-width-*, --shadow-*, --type-*). It must never use --primitive-* or a raw hex value. Primitives exist only so roles can point at them. This keeps the design system the single source of truth.
Enforce it: also write scripts/check-tokens.js. It scans every .css, .html, .js and .jsx/.tsx file under src/ and styles/ except styles/tokens/primitives.css, and exits with an error if it finds a #hex colour, an rgb( or hsl( literal, or var(--primitive-. It must print each offending file and line.

CHECKS BEFORE YOU FINISH
- If an alias points at a variable that does not exist, stop with an error.
- Print the count of variables read and CSS custom properties written, per collection.
- Run the script, then run check-tokens.js, and show me both outputs.
- Do not add dependencies.
Tell me anything in the JSON you could not convert, instead of guessing.
```

What went wrong: the build skips some values on purpose, as the prompt told it to: the breakpoint variables, the 15 line-height multipliers and the 21 per-variable shadow tokens. I later found out that the shadow colour is not bound to a variable, and that came from this build.

What I changed: I know of no change. The regression test later proved the build and check do work: the check failed on the raw hex.  

---

## Prompt 2: baseline screen, no design system

Where it ran: a new empty folder outside the project, so the agent could not see my tokens.
Agent reply saved in: evidence/09-screen-without-system.txt
Screenshot: evidence/09-screen-without-system.png

```
Build one web page for a phone shop called DG Tech-Store (also known as Gadget Plug). It is a single product screen for one phone. Design it for a 360px-wide phone first, and make it work on larger screens too.

Use only plain HTML and CSS, in two files: index.html and style.css. No frameworks, no build step, no external fonts or libraries.

Sample content (use exactly this):
- Product: Samsung Galaxy A15, 128GB
- Price: ₦185,000
- Stock status: In stock
- Warranty: 12 months
- A short description of two sentences
- Main button: Order on WhatsApp
- Second button: Call the shop
- Small note: Pay on delivery available

Make it look good. Do not ask me questions. Make your own choices and finish the page.
```

Note: the sample content (price, warranty, pay on delivery) was not from the shop. It was placeholder content to keep both builds equal.

What went wrong: The agent invented content I never gave: a struck-through ₦200,000, “Save ₦15,000”, “Same-Day Fast Dispatch”, “100% Genuine Guaranteed”, a spec grid, colour options and a “Special Offer” tag.
The page was dark navy with cyan, green and amber. The shop’s orange-red appeared nowhere.
The “Order on WhatsApp” button looked cut off at the right edge at 360px. You can check it for yourself at `evidence/09-screen-without-system.png`.

What I changed: Nothing in the baseline files (`index.html` and `style.css`). I kept the baseline in its separate folder outside the project repo and saved its screenshot (`evidence/09-screen-without-system.png`) and transcript (`evidence/09-screen-without-system.txt`) as the "before" evidence. For Prompt 3 inside `task-01-design-system/`, I changed the target paths in the prompt to `src/index.html` and `src/style.css` and copied the baseline's full content list so both builds could be compared directly.

---

## Prompt 3: the same screen with the design system

Where it ran: inside the project (task-01-design-system).
Agent reply saved in: evidence/10-screen-with-system.txt
Screenshot: evidence/10-screen-with-system.png

Note: the content list in this prompt copied the text from the baseline page, including the invented
₦200,000, "Save ₦15,000" and dispatch claims. This was done so both builds show the same content and the
comparison is fair. These claims are listed as a defect in docs/defects.md.

```
Build one web page for a phone shop called DG Tech-Store (also known as Gadget Plug). It is a single product screen for one phone, designed for a 360px-wide phone first, and it must work on larger screens.

Create two files: src/index.html and src/style.css. Plain HTML and CSS only. No frameworks, no build step, no external fonts, libraries or images.

DESIGN SYSTEM (this is the point of the task)
The design system is already in this project, generated from tokens. Link styles/tokens/index.css from index.html (path: ../styles/tokens/index.css). Do not edit anything in styles/, tokens/ or scripts/.
In src/style.css and src/index.html, use ONLY these:
- colours: var(--color-*) role variables
- spacing: var(--spacing-*)
- corner radius: var(--radius-*)
- border widths: var(--border-width-*)
- shadows: var(--shadow-hard), var(--shadow-medium), var(--shadow-soft)
- text: the .type-<style> classes (15 styles) or the --type-* variables. Choose the right style for each element.
Never use a hex colour, rgb(), hsl() or any --primitive-* variable. Never write a raw number of pixels for spacing, radius, border width, font size, line height or letter spacing. 0, 100%, auto and media queries are allowed. Colour roles switch between Light and Dark by themselves, so write no dark-mode colours of your own.
If you need a value that the tokens do not provide, do not invent one. Stop and tell me which value and where, then finish the rest.

CONTENT (use exactly this, nothing more)
- Top strip: Same-Day Fast Dispatch Available; 100% Genuine Guaranteed
- Header: DG Tech-Store; also known as Gadget Plug; Open for Orders
- Tags: Official Samsung; Special Offer
- Product: Samsung Galaxy A15, 128GB; Original Global Version · Dual SIM · 4G LTE
- Status: In stock; 12 months warranty
- Price: ₦185,000, with ₦200,000 struck through, and Save ₦15,000
- About this phone: Experience ultra-crisp visuals and fluid scrolling with the 6.5-inch Super AMOLED 90Hz display powered by an efficient octa-core processor. Capture stunning high-resolution photos with the 50MP triple camera while enjoying dependable all-day battery life backed by 25W fast charging.
- Spec cards: Storage 128GB Internal; RAM 4GB / 6GB Boost; Rear camera 50MP + 5MP + 2MP; Battery 5,000 mAh; Stock status In stock; Warranty 12 months
- Colours: Blue Black, Light Blue, Yellow
- Note: Pay on delivery available. Inspect your Samsung Galaxy A15 before making payment. Fast dispatch to your doorstep.
- Buttons: Order on WhatsApp (main); Call the shop (second)
- Trust lines: 12 Months Official Warranty; Brand New Sealed Unit
- Footer: DG Tech-Store · Gadget Plug. Your verified gadget plug in Nigeria. Quality guaranteed.
No images. Use a plain box where a product photo would go.

WHEN YOU FINISH
Run: node scripts/check-tokens.js and show me the full output. Tell me anything you could not do with tokens alone. Do not ask me questions before you start.
```

What went wrong: 
- It used the error colour for “Save ₦15,000”.
- It hard-coded the breakpoints at 840px, 600px and 600px.
- It has no 1200px or 1600px layout.
- The 3-column spec grid may be cramped at 900px.
- The invented claims were still on the page. That was my doing: I copied the baseline’s content into the prompt so the comparison would be fair. Say that plainly.

What went right: the agent’s check passed, and my search found zero raw colours and no --primitive-* in src/. The brand colour appeared.

What I changed: nothing in src/ yet. I chose to record the problems in defects.md and fix them later, because evidence 07, 08 and 10 point to the current lines.


---
`
## Prompt 4: which type style did the agent use?

Agent reply saved in: evidence/08-agent-typography-answer.txt

```
Which typography style did you use for the price ₦185,000 in src/index.html? Give the class name and the line number. If you did not use one of the 15 type styles for it, say so.
```

What went wrong: The type-headline-large at src/index.html:72. I expected the agent to choose the most appropriate style from the 15 available type styles, not use M3 design rules.
What I changed: i have given all headlines,teeading, and titles a bolder weight than it was suggested by M3 design style guide

---

## Prompt 5: raw-value search

Saved in: evidence/07-raw-value-search.txt

I ran these three searches myself, from inside task-01-design-system:

```
grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' . --exclude-dir=.git --exclude-dir=node_modules
grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|var\(--primitive-' src styles --exclude=primitives.css
grep -nE '[0-9.]+(px|rem|em)' src/style.css src/index.html
```

---
name: tally-ui-design
description: Project-specific instructions for designing Tally's JavaScript PWA with accessible, solid-colour, iOS-inspired interfaces. Read with tally_specs.md before designing or changing Tally screens.
---

# Tally UI Design Guide

Research date: 16 November 2026  
Status: Research-informed implementation guidance; not evidence that the interface is implemented.  
Companion: [Tally product specification](tally_specs.md).

Product update: incorporates *Specification Addendum 01 — Native-first app, five-tab navigation* from `attached_assets/AI_Kitchen_Native_App_Design_Update_v1_1_1794819465733.pdf`. It supersedes earlier three-tab/header-Settings guidance. The user's JavaScript/PWA, strict native experience, and no–Liquid Glass instructions remain unchanged.

Shared baseline: preserve the approved Settings look across every screen. Merely using grouped white rows is insufficient; native hierarchy, typography, control geometry, spacing and interaction quality must follow the supplied images and HIG. Home's personal recipe promotion is genuine kitchen content, not generic marketing copy. IndexedDB and Settings sync tracking are deferred in [indexeddb_sync_plan.md](indexeddb_sync_plan.md); do not present them as active features.

Settings visual target: `attached_assets/IMG_1983_1794826405287.webp`. Follow its compact centred title, circular toolbar controls, inset rounded groups, monochrome circular icon badges, aligned thin row dividers, light-grey/white and true-black/charcoal surfaces. Apply the look to actual Tally settings, not the reference's finance-specific options. Retain Tally's five labelled tabs; do not imitate the reference's device frame, status bar or home indicator.

The user approved this direction and requested larger corner radii and more solid iOS-like colours. Preserve the layout; use fully opaque pure-white light surfaces, neutral light-grey surroundings, black text, and true-black/charcoal dark surfaces with white text. Avoid warm/off-white tints or lavender in Settings. Use semantic colour roles with light/dark variants, following [Apple HIG colour guidance](https://developer.apple.com/design/human-interface-guidelines/color); the browser palette is an approximation, not access to UIKit's dynamically resolved colours. Keep the no–Liquid Glass rule.

## 1. Purpose and authority

Design a personal kitchen companion that feels refined, calm, premium, and easy to use while cooking or shopping. The person's recipes and current task are more important than decorative interface elements.

This is a **React + Vite PWA implemented in JavaScript/JSX**, not an Expo app or a TypeScript project. The user's visual reference is **iOS 7+ design principles, with solid colours and no Liquid Glass**. Make it feel native through familiar navigation, responsive controls, clear hierarchy, and reliable behaviour—not through browser-disguising effects.

### Native experience is a release gate

The user's strict requirement: **“it must never ever look or feel like a pwa but must and I mean must look and feel native”.**

PWA describes the delivery technology only. A merely mobile-friendly website, responsive dashboard, or app-shaped webpage fails this requirement. Native appearance **and behaviour** must be assessed together on the target phone.

- Use app screens, native-convention navigation/back stacks, solid sheets, grouped controls, and contextual actions—not website headers, marketing sections, footers, or desktop menus squeezed onto a phone.
- Routine navigation must not reload the whole document. Preserve screen state, scroll position, draft input, and selection rather than remounting a blank/loading page on every tab change.
- Touch controls need immediate pressed/selected feedback. No core task may depend on hover; avoid accidental double activation and delayed-looking interactions.
- Keep transitions restrained, coherent, and spatially understandable. No glass effects, decorative page entrances, or layout jumps. Respect reduced motion.
- Handle the software keyboard, focus, text entry, safe areas, scrolling, sheets, and dismissal as app interactions. Keep the composer and primary actions reachable.
- Use familiar platform conventions for Back, Cancel, Done, pickers, toggles, and confirmation. Browser-default alerts or prompts are not the app's routine interaction design.
- The installed experience should open standalone with correct icons, launch colours, and no app-created browser-like chrome. Do not put “PWA” branding or technical installation language into everyday product screens.
- Do not fake native features. Unavailable OS capabilities require an honest, well-designed alternative, not an inert control or misleading animation.
- Before accepting a screen, ask: **Does it look and respond like a native app during the actual task, not just in a screenshot?** If not, revise it.

Browser-owned permission prompts, browser chrome when opened in a browser, installation UI, and OS/browser capability limits are outside full app control. Document those boundaries honestly; do not use them to excuse website-like design inside Tally. Do not promise indistinguishability from every native app or automatic access to native-only APIs.

**Apple's official Human Interface Guidelines (HIG) are Tally's primary external design reference.** Use this design-reference hierarchy:

1. The user's latest explicit instructions.
2. Confirmed product requirements in `tally_specs.md`.
3. **Apple HIG** for native component choice, hierarchy, navigation, interaction, typography, and platform behaviour, adapted to the user's solid-colour/no–Liquid Glass requirements.
4. Supplied images as native look-and-feel design references, applied within the confirmed product, colour, material, and accessibility constraints.
5. NN/G as supporting UX research, not an alternative primary design direction.
6. Proposed defaults, which remain adjustable.

MDN and W3C/WAI define correct web semantics and accessibility implementation; they are not competing visual styles. Apply their technical/accessibility requirements throughout this hierarchy. Other implementation skills must preserve this HIG-led direction rather than introduce a separate aesthetic.

The architect reviewed the product constraints and the verified research before this guide was written. This is a project guide, not a claim of Apple endorsement or a globally installed Agent skill.

### Supplied images are part of this design guide

The user clarified that the attached images are references for **native look and feel**, not merely food imagery. Use them as visual evidence during both implementation and review:

- `attached_assets/IMG_1974_1794818558868.webp`: study the native screen composition, clear typographic hierarchy, solid grouped surfaces, rounded control treatment, bottom-navigation emphasis, and purposeful placement of food photography.
- `attached_assets/IMG_1975_1794818558868.webp`: study the grouped detail information, spacing, touch-control geometry, uncluttered screen structure, and prominent primary interaction.
- `attached_assets/IMG_1978_1794818558866.png`: retain the colour-role and platform-typography direction, subject to the newer addendum and the user's explicit stack choices.

Translate those qualities into Tally's Home, cookbook, recipe details, assistant, groceries, Settings, and supporting screens. Do not substitute a generic website layout and claim that adding food photography matches the references. No exact pixel-for-pixel reproduction is required.

Where an image conflicts with confirmed requirements, retain the five-tab structure, orange/gold/pink roles, accessible contrast, and opaque no-glass surfaces. Do not copy gradients, scanning, nutritional charts, or extra product features. Static images establish a visual target; native touch, navigation, transitions, and keyboard behaviour still need separate verification.

## 2. Research basis and historical boundary

### Supporting UX/UI research: Nielsen Norman Group

Use these researched principles to support the primary Apple HIG direction:

| Principle | Apply it to Tally | Source |
| --- | --- | --- |
| Visibility of system status | Clearly distinguish listening, processing, draft, saving, saved, failed, and offline states. | [N1] |
| Match the real world | Use “Ingredients”, “Servings”, “In your cart”, and other familiar cooking/shopping language. | [N1] |
| User control and freedom | Provide Cancel, Back, Stop recording, correction, and reversible checklist actions. | [N1] |
| Error prevention | Require review before saving AI proposals; clarify quantities rather than invent them. | [N1] |
| Recognition rather than recall | Keep ingredient quantities visible during review and recent-item shortcuts available in the assistant. | [N1] |
| Discoverable navigation | Keep the five confirmed labelled destinations visible instead of hiding them in a hamburger menu or overflow. | [N2] |
| Comfortable touch | Use generous targets and spacing, especially during cooking and shopping. | [N3] |

NN/G discusses roughly **1 cm × 1 cm physical touch targets** and explains why physical context matters. Do not describe that as an exact number of CSS pixels; verify the rendered experience on real devices.

### Primary design reference: Apple Human Interface Guidelines

Start design decisions with Apple's official [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/), including consistent interaction, semantic colour, readable typography, accessibility, and tab navigation. [A1–A5, A8–A12] Use the supplied images to interpret the desired look within this framework; use NN/G to validate usability, not replace the native design basis.

**Historical distinction:** Apple's archived iOS 7 documentation says bars were translucent by default. It also describes opaque-bar layouts and tint colours that indicate interactivity. [A6, A7] Therefore:

- Describe Tally as an **iOS 7+ inspired, solid-surface adaptation that excludes Liquid Glass**.
- Do not claim that all iOS 7 interfaces were opaque or that this is a historically exact recreation.
- Do not interpret “iOS 7 onward” as a requirement to run on the obsolete iOS 7 browser.
- Current Apple HIG pages contain Liquid Glass recommendations. Their glass/material treatment is explicitly excluded from Tally; relevant navigation, colour, type, and accessibility principles still apply.

## 3. Non-negotiable visual treatment

- Use solid, opaque backgrounds for pages, cards, sheets, dialogs, headers, tab bars, and controls.
- No Liquid Glass, frosted panels, background translucency, refraction, specular glass highlights, or `backdrop-filter`.
- No gradients for primary interface surfaces or primary colour fills.
- No floating glass-pill navigation or controls that morph over content.
- Use whitespace, typographic hierarchy, solid separators, grouping, and restrained shadows to distinguish layers.
- Keep food photography natural and useful; photos are content, not a substitute for accessible labels.
- Do not add nutrition dashboards, calorie rings, meal scanning, or public recipe feeds merely because they appear in reference images.
- Avoid decorative animations and excessive rounding that make the app feel playful rather than sophisticated.
- Use a solid dim background behind modal surfaces if strict opacity is required; don't blur the underlying screen.

These exclusions are the user's design direction, not a statement that Apple requires opaque interfaces.

## 4. Semantic colour system

The addendum confirms **orange primary in light mode; gold replaces orange in dark mode; pink is tertiary; black and white form the secondary foundation**. Its suggested starting shades are orange `#F97316`, gold `#E8B44B`, and pink `#F3A6BF`. Exact shades remain adjustable. The following values are **proposed custom Tally tokens**, not approved final branding or Apple system-colour values; neutral surface variants support the black/white foundation.

| Token | Light | Dark | Intended role |
| --- | --- | --- | --- |
| `background` | `#F7F6F2` | `#111113` | Page canvas |
| `surface` | `#FFFFFF` | `#1C1C1E` | Cards, sheets, bars |
| `surface-inset` | `#EFEDE7` | `#28282B` | Inputs and grouped sections |
| `text` | `#191919` | `#F5F5F7` | Primary reading text |
| `text-secondary` | `#62625F` | `#B7B7BC` | Secondary information |
| `separator` | `#D9D7D1` | `#45454B` | Decorative division only |
| `control-outline` | `#787872` | `#85858C` | Essential unfilled-control boundaries |
| `accent-fill` | `#F97316` | `#E8B44B` | Primary action fill; addendum starting shades |
| `on-accent` | `#191919` | `#191919` | Text/icons on accent fills |
| `accent-text` | `#B54400` | `#E8B44B` | Interactive text and essential accent icons |
| `tertiary-pink` | `#F3A6BF` | `#F3A6BF` | Restrained tertiary emphasis; dark variant may be refined |

### Colour-use rules

- Give a colour one consistent semantic purpose. Selection, danger, and success must not become interchangeable. [A1]
- Orange/gold are brand/action accents, not automatic warnings or nutrition indicators.
- Use pink as tertiary colour, not a second primary or the sole indicator of an actionable control or state.
- Pair every meaningful colour state with text, an icon, a checkmark, or a boundary change.
- Use separate tokens for destructive, warning, success, focus, and disabled states. Choose and verify those pairs during implementation; don't guess that a familiar red or green is accessible.
- Honour system light/dark preference initially, with an explicit user override.
- Add a higher-contrast treatment when requested; do not assume custom CSS tokens automatically inherit native iOS accessibility variants.
- Test every actual foreground/background pair. A token's passing result on one background does not certify other uses.

### Calculated contrast examples

Calculated with the WCAG sRGB relative-luminance formula; ratios below are rounded for reporting only.

| Foreground / background | Ratio | Guidance |
| --- | --- | --- |
| `#191919` / `#FFFFFF` | 17.58:1 | Primary light text |
| `#62625F` / `#F7F6F2` | 5.66:1 | Secondary light text |
| `#191919` / `#F97316` | 6.27:1 | Dark label on orange button |
| `#FFFFFF` / `#F97316` | 2.80:1 | **Do not use for normal button text** |
| `#B54400` / `#FFFFFF` | 5.54:1 | Accessible light-mode accent text |
| `#191919` / `#E8B44B` | 9.26:1 | Dark label on gold button |
| `#B7B7BC` / `#1C1C1E` | 8.52:1 | Secondary dark text |
| `#787872` / `#FFFFFF` | 4.44:1 | Essential light control outline |
| `#85858C` / `#1C1C1E` | 4.64:1 | Essential dark control outline |

Orange `#F97316` against white is also only 2.80:1: it cannot be the only essential icon or control boundary there. Use `accent-text`, a qualifying outline, or another tested treatment. Low-contrast separators are decorative, not checkbox borders or focus indicators.

For this web app, use WCAG 2.2 thresholds: normal text ≥4.5:1; large text ≥3:1 only at ≥24 CSS px regular or ≥18.67 CSS px bold; essential non-text controls/states ≥3:1 against adjacent colours. Small bold text does **not** automatically qualify as large text. [W1, W2]

## 5. Typography and hierarchy

- On iOS, use the system font through `-apple-system`, `BlinkMacSystemFont`, and appropriate system fallbacks. Do not bundle an unlicensed SF Pro font file.
- The addendum provisionally interprets “jartaka” as **Plus Jakarta Sans**. Confirm that exact Google font family before implementation; Android's precise mapping remains open. Until settled, use a reliable system/sans-serif fallback rather than treating the interpretation as approved.
- Prefer readable regular/medium text; use semibold for important actions and headings. Avoid ultralight recipe instructions.
- Proposed web scale: body 17 CSS px (`1.0625rem` with a default 16px root), supporting text 15–16px, metadata 13–15px, section titles 20–22px, screen titles 28–34px.
- These web sizes are **Tally design choices**, not a literal conversion of Apple's point sizes. Apple's current guidance lists a 17pt default iOS text size. [A2, A3]
- Use relative font sizing, comfortable line height, and wrapping. Support at least 200% text enlargement/zoom without hiding quantities or actions.
- Preserve hierarchy at large text sizes; stack information rather than truncating important labels.
- Do not disable pinch zoom or rely on native Dynamic Type APIs that the PWA does not implement.

### Concise iOS interface copy

**Confirmed correction:** native in Tally means recognisably iOS, not merely a responsive or generic mobile interface. Routine controls should be understandable from their familiar form, position, and concise label—not surrounded by website-style explanations.

- Remove redundant marketing taglines, introductory paragraphs, repeated eyebrow labels, and subtitles that restate a screen title or action.
- Prefer direct labels such as “Cookbook”, “Add recipe”, “Ingredients”, and “Save”; use actual recipe/list metadata instead of promotional description.
- Use local supporting text only when it helps someone make a decision or recover: units, validation, empty-state next steps, offline/error status, privacy, unsaved changes, approval, or irreversible deletion.
- Do not remove persistent input labels, screen-reader names, necessary warnings, or instructions that prevent an incorrect save just to reduce visible text.
- An empty state may briefly explain what is missing and offer one useful next action. It must not become a marketing page.
- In Settings, distinguish the guest kitchen with concise “Guest” / “On this device” metadata and a real Sign in row. Keep local-storage limitations in the user-opened privacy disclosure, not a promotional panel.
- Judge copy together with hierarchy and control placement; deleting all paragraphs does not by itself create native iOS design.

### Iconography: Hugeicons

**Confirmed:** use **Hugeicons** for Tally's interface icons. The user's latest instruction supersedes the earlier Iconoir choice. Select simple outline glyphs that fit familiar iOS meanings; Hugeicons is not Apple SF Symbols.

- Use `@hugeicons/react` with `@hugeicons/core-free-icons` consistently through the shared interface-icon adapter. Do not mix Iconoir, Lucide or another interface icon family into screens.
- Working five-tab mapping: Home → `Home01Icon`; Cookbook → `BookOpen01Icon`; AI Assistant → `SparklesIcon`; Groceries → `ShoppingBasket01Icon`; Settings → `Settings02Icon`.
- Use a coherent outline treatment, inherited semantic colour, and optical alignment. The current working stroke is 1.5, with restrained 1.8 emphasis for active/central navigation; these are Tally choices, not Apple-mandated values.
- Hugeicons' free Stroke Rounded family uses a 24×24 grid; the React renderer supports explicit size, colour and stroke width. Keep the surrounding hit area large enough regardless of glyph size. [I1]
- Preserve tab labels, accessible button names, and visible state cues. Decorative SVGs are hidden from assistive technology; an icon-only action still needs a meaningful accessible name.
- Custom brand artwork/app icons are a separate asset category, not permission to introduce a second family of interface glyphs. Do not replace a meaningful symbol with a merely similar-looking but misleading one.

## 6. Navigation and screen behaviour

- Exactly five persistent, labelled bottom destinations in this order: **Home | Cookbook | AI Assistant | Groceries | Settings**.
- AI is the third and centre destination; give it the strongest emphasis without reducing the other targets or obstructing content.
- A tab navigates; it does not immediately start recording, save, scan, or create an item. [A4]
- Preserve search, scroll position, and meaningful task state when switching destinations.
- Keep all destinations available even when their collections are empty; explain empty states rather than disabling tabs.
- Use a solid tab bar with a visible active state, icon, label, and safe-area padding.
- Settings is the fifth bottom tab and no longer needs repeating in each main-page header. The AI screen retains direct recent-recipe and recent-list shortcuts.
- On Assistant, present those shortcuts as icon-only links at opposite ends of the centered header: Cookbook/recent recipe on the left, Groceries/recent list on the right. Remove the side-by-side shortcut cards, preserve their destinations and collection fallbacks, and give both meaningful accessible names and at least 44 × 44 CSS px targets.
- Assistant's primary experience is a live voice call with recipe/grocery components updating within the conversation, not voice messages. Keep readable text as a fallback, real listening/speaking/mute/end controls, and deliberate review/edit states rather than a permanently expanded form consuming the conversation.
- Personal memory uses a compact “Memory updated” event only after a successful write, with a reachable inspect/edit/forget/disable surface. Preserve conversation space and avoid redundant explanations; keep essential provider-processing, device-storage and retention disclosures accessible.
- Recipe details, list details, account screens, and editors are secondary screens, not additional bottom tabs.
- Use familiar Back/Cancel controls and browser history. Gestures are optional shortcuts, never the only way out.

The new addendum resolves the earlier screenshot/PDF navigation conflicts: five tabs make AI both third and centred, and Settings moves to its own tab. Do not reintroduce the old three-tab bar or mandatory header Settings shortcut.

### Home design

- Put Recent groceries above recipe sections. Combine latest and recent recipes under one Recent recipes heading; newest recipes come first. Stack the Add recipe tile above recipe cards or the visible dot empty state on mobile, never alongside that state. Keep Most opened distinct and remove the separate latest-recipe promotion.
- Home-specific visual reference: `attached_assets/IMG_1984_1794827303234.webp`. The user supplied it to show native Home composition and feel, **not** to adopt its fashion-shopping content. Apply its compact greeting, clear section rhythm, appropriately sized controls and mobile collections to Tally's kitchen content.
- **User clarification:** Home must use the approved **Settings look, feel and design system**. The Home image guides the **section arrangement**, not a different visual theme. Reuse Settings' solid neutral white/grey/black surfaces, rounded geometry, Hugeicons and control treatment.
- Use solid filled components without decorative card borders or outlined chips/buttons. Separate surfaces with spacing and contrasting opaque fills; retain meaningful thin row separators and accessible keyboard focus indicators. This is Tally's chosen treatment, not a claim that HIG universally prohibits every kind of outline.
- The modules come from `tally_specs.md` and its PDF/addendum sources, not from the reference's trending items, shopping categories, offers or notifications. Do not copy those features or the image's device frame/status bar/home indicator.
- Home is a confirmed native-feeling app destination, not a marketing landing page.
- Retain the approved greeting, real recipe/list access and guest-accessible AI entry. Personal recipe/meal promotion and most-opened recommendations are confirmed Home content; optional addendum modules such as a kitchen overview are not automatically approved.
- Treat Continue cooking as a route back to the latest recipe, not evidence of tracked cooking progress.
- If chosen, a Talk to your AI action opens the assistant; starting voice still requires an explicit microphone action.
- Base any overview on real saved records; never invent pantry quantities, activity, recipe counts, or shopping progress.
- Home promotion uses the current kitchen's existing saved recipes/meals, not a generic AI advertisement or invented public catalogue. Promotion and most-opened recommendation sections remain visible when empty, using a quiet solid dot and clear concise text about what will appear. Recommendations use actual recipe-detail opens; label them as opened, not confirmed cooked. All Home AI links open the assistant for guests as well as signed-in users.
- Keep the screen restrained and task-focused, with the same solid surfaces, accessible scaling, safe areas, transitions, keyboard handling, and touch feedback as all other screens.

## 7. Touch, layout, and PWA constraints

- Tally's chosen minimum interactive hit area is **44 × 44 CSS px**; prefer 48–56px for frequent/primary actions and comfortable full-width grocery rows.
- Apple's current table lists **44 × 44pt default** and **28 × 28pt minimum** controls for iOS/iPadOS. Do not call 44pt its current minimum. CSS pixels, Apple points, and device pixels are different units. [A3]
- Provide spacing between competing targets; enlarge the hit area around small visible icons.
- Keep destructive actions away from frequent checklist and microphone controls.
- Use safe-area insets and sufficient bottom content padding so the final row is never hidden by navigation.
- With five tabs, verify all labels and targets fit narrow supported phones and enlarged text. Do not solve crowding by hiding a tab, removing accessible names, shrinking hit areas, or adding overflow.
- Accommodate the virtual keyboard; keep message input, current field, and submit control visible.
- Use real buttons, links, labels, headings, lists, and form controls rather than clickable generic containers.
- Responsive web layouts must work on phones, tablets, and desktop without horizontal scrolling or fake device frames.
- Installation hints must match the browser and appear only when relevant. Do not promise universal browser install prompts, background recording, or native haptics.

### Buttons, links and action hierarchy

- Apple HIG recommends a prominent style for the most likely action, generally limiting prominent buttons to one or two per view. Use style rather than inconsistent sizes to distinguish actions. Do not make every navigation link a competing primary button. [A8]
- For Home, **Add recipe** is the primary filled quick action; planning groceries and opening the assistant remain secondary. Collection destinations use quiet labelled controls and chevrons. Recipe/list cards are tappable as a whole.
- Text-only secondary navigation is compatible with a native interface. Avoid underlined website-link styling, but do not add an unnecessary filled pill around every label.
- For Home navigation labels, use the same small Hugeicons chevron as **Cookbook** and **All lists**, including **Sign in / Open assistant**, **Add recipe** and **Plan groceries**. The user prefers this over straight shafted arrows.
- Keep the chosen 44 × 44 CSS px hit areas, clear action labels, adequate spacing and a visible pressed state on every interactive control, including quiet text links. Retain keyboard focus indicators and meaningful accessible names for icon-only controls. [A3, A8]
- In this web implementation, retain real router links for navigation and real buttons for actions, form submission and sheet presentation. Appearance alone does not change a control's semantics; do not replace links with JavaScript-only click handlers to imitate native controls.
- Loading and disabled treatments must reflect actual state, and destructive actions must not receive primary/default emphasis. Continue using solid opaque surfaces without decorative outlines or Liquid Glass. [A8]

### Native screen sections: structure and separation

**Primary research:** Apple HIG Layout, Lists and tables, Scroll views, and Collections. Apple developer documentation for `Section` and the WWDC list-layout presentation provide supporting structural examples—not a requirement to change Tally to SwiftUI/UIKit. [A11, A13–A18]

A native section is a **meaningful group inside a task-focused screen**, not a full-width marketing block or necessarily an HTML `<section>`. Separate the screen's navigation, content hierarchy, and temporary presentation:

```text
Screen
  Navigation context: current screen / Back / relevant actions
  Main content, usually one vertical scrolling area
    Optional screen introduction or metadata
    Content section
      Optional concise section heading
      Related rows, fields, media, or instructions
      Optional supporting section footer
    Next meaningful content section
  Persistent five-tab navigation
  Temporary sheet/dialog only when a separate modal task is necessary
```

This is a Tally structure model informed by Apple guidance, not a universal Apple-mandated template. A native screen may be mostly a single list; it does not need multiple sections, a card for everything, or a heading repeated above every group.

#### Choose the right grouping pattern

| Pattern | When it fits | How it is separated |
| --- | --- | --- |
| Plain list | A continuous collection such as saved recipes or dated history. | Aligned rows and restrained separators; optional meaningful headers. |
| Grouped list | Distinct families of related settings or form fields. | Space and optional headers/footers between groups; row dividers within a group. |
| Inset-grouped list | Clearly bounded, related controls or rows such as Settings groups. | An opaque group surface inset from the screen edges, with one outer group shape and consistent inner row alignment. |
| Reading/detail sections | Ingredients, Method, and Notes in a recipe. | Typographic hierarchy, alignment and spacing; a surface or separator only when useful. Do not wrap every paragraph or step in a separate card. |
| Collection/grid | Genuine visual content where images help identification, once real recipe media exists. | Repeated image/item geometry and consistent spacing. Text-first settings and groceries remain better suited to rows. |
| Sheet/dialog | A temporary focused decision, review task, or editing task when modal presentation is justified. | A distinct accessible presentation with its own dismissal/focus rules, not simply another group inside the screen. |

Plain, grouped, and inset-grouped are established native list appearances; none is mandatory for every screen. Grouping follows information relationships, not a desire to make everything look like a rounded card. [A11, A15, A17, A18]

#### Separation and hierarchy rules

1. **Group by meaning.** Keep related settings, quantities, or actions together. Use smaller spacing within a group and a clearer gap between unrelated groups. Exact spacing is a reusable Tally token, not an invented universal Apple pixel value. [A13]
2. **Align the content.** Related text, values, and actions share deliberate leading/trailing guides. Indentation indicates hierarchy; it is not decoration. Allow reading order and alignment to adapt for right-to-left content where supported. [A13]
3. **Use section headings to name the group.** Keep them concise and visually subordinate to the screen title. Use a logical heading hierarchy; not every group heading needs uppercase, oversized text, or a second description. [A11, A16, M2]
4. **Use section footers for local explanation.** A note beneath a settings group explains those settings; it is not a website footer. Essential instructions and unresolved approval warnings must remain visible where needed, not hidden in faint fine print. [A11, A16]
5. **Use row separators inside a shared group when helpful.** In typical icon-and-label list rows, align an inset separator with the primary text/content, not arbitrarily with the icon. Distinguish row separators from group boundaries. Decorative separators do not replace an accessible control boundary. [A18]
6. **Avoid stacked outlines.** Do not add a border around the group, another card border around every row, and multiple dividers unless each communicates something necessary. Use the least decoration that preserves clear relationships. This restraint is a Tally design choice applying HIG grouping principles.
7. **Distinguish row behaviours.** A navigation row opens detail and may use a disclosure chevron; a checkable grocery row changes selection and shows a check state; a value row is informational. Do not make every row look tappable or attach chevrons to all content. [A11]
8. **Let content determine row height.** Respect text enlargement and multiline labels; do not force fixed-height groups that clip quantities, descriptions, or actions. Preserve the same grouping hierarchy at larger sizes. [A13]
9. **Usually use one vertical scroll area.** Avoid vertically scrolling boxes nested inside a vertically scrolling screen. An independently scrolling assistant transcript is a deliberate conversation pattern, not permission to make every section scroll independently. Horizontal visual collections may sit inside a vertical screen if genuinely useful. [A14]
10. **Keep navigation and the keyboard from covering content.** Apply safe areas and sufficient content insets. Sticky section headers are optional and need a useful orientation purpose; they must not accumulate into obstructing bars. Keep the active field and its relevant actions reachable. [A13, A14]
11. **Preserve context.** Restore meaningful scroll/task state on return, and scroll automatically only enough to reveal the relevant field or result. Do not jump to the top because a checkbox changed. [A14]
12. **Use opaque separation.** Where current HIG examples recommend glass, blur, or scroll-edge materials, retain only the hierarchy/orientation intent. Tally uses solid bars/surfaces, spacing, and appropriate separators instead.

#### Application to Tally

| Screen | Working section structure |
| --- | --- |
| Home | A concise app welcome and a restrained set of genuine latest-item/assistant entry groups. No marketing hero-to-features-to-footer sequence; no invented activity. Home module selection remains adjustable. |
| Cookbook | Screen context and search followed by a coherent recipe list. Add meaningful grouping only if useful real data supports it; do not fabricate categories or counts. |
| Recipe detail | Title and known metadata, then Ingredients, ordered Method, and optional Notes/media. Keep cooking instructions readable as content, not dashboard tiles. |
| Recipe editor | Related identity/serving fields, ingredient rows, method steps, optional notes, and explicit save/approval actions. Keep validation with the relevant field/group. |
| AI Assistant | Recent saved-item shortcuts, a conversation area, and reachable composer; draft review is a distinct group/presentation that remains clearly unsaved until approval. |
| Groceries history | Clear dated list rows; temporal sections only when useful. An individual list has context/progress, one coherent checklist or real category groups, and local shopping guidance. Checking a row must not restructure the whole screen. |
| Grocery planning | Related recipe/serving choices, on-hand inventory input, and a separate unsaved review/approval group. Do not bury incompatible-unit warnings in a distant section. |
| Settings | Related inset-grouped rows/choices, with useful local labels/explanations. Account, appearance, and privacy remain distinguishable; only actual implemented preferences appear actionable. |

**Cookbook visual references:** use `attached_assets/IMG_1975_1794828237439.webp` and `attached_assets/IMG_1974_1794828237441.webp` for native food/recipe composition, alongside the approved Home and Settings visual system. Keep the same opaque palette, rounded surfaces, Hugeicons, borderless controls, chevrons and interaction hierarchy. These images do not authorise nutrition/scanning/trending features or fabricated personal recipe photography; no-cover recipes need an intentional native fallback.

**Cookbook toolbar:** the header plus is the single add affordance; do not repeat an **Add recipe** button in the empty state. The user refined the header arrangement: **Search on the left, Cookbook centred, plus on the right**, with equal-width control areas so the title looks balanced. With no restored query, keep the field collapsed until requested, then reveal it with a short animation and focus it. Respect reduced motion; collapsed search must not remain focusable or hide an active filter. Retain the saved query when returning to an ongoing search.

For the iOS web implementation, reveal/enable the search input before focusing it **within the initiating tap handler**, rather than deferring focus to an animation callback. Keep input text at least 16 CSS px to avoid Safari's automatic focus zoom. Escape dismisses search and returns focus to its toggle.

**Groceries collection:** apply the same approved visual system and compact, optically balanced header. The single header plus opens the existing planner; do not repeat planning buttons in empty states and footer rows. Show the actual latest approved list and older lists separately with dates and real item/check counts. Checks mean **in cart**, not purchased or restocked. Do not invent statuses, categories, pantry quantities or sync controls from recommended/future scope. Preserve existing planning, approval, list-detail and check-off behaviour.

**AI Assistant:** reuse the approved opaque visual system for the recent-recipe and recent-list shortcuts, conversation, composer and editable draft review. Guests have the same chat and explicit approval flow without a sign-in gate; approved guest recipes save on this device, not into a cloud account. Explain the essential distinction concisely: messages use online AI, while guest kitchen records stay local. Distinguish the unsaved draft from saved records, preserve edits and failed messages, and keep **Approve & Save** explicit. The current text-chat surface must not display pretend microphone/call controls or imply that the separate voice requirements have been implemented.

Reuse contracts such as **SectionGroup, SectionHeading, SectionFooter, ListRow, ChecklistRow, and RowSeparator** for repeated patterns. These are shared design responsibilities, not claims that components with those names already exist in code. Use semantic headings/lists/labels underneath; an HTML `<section>` is appropriate for a thematic headed group, while a neutral layout wrapper may simply be a `<div>`.

## 8. Required interaction states

| Area | Required behaviour |
| --- | --- |
| First use | Explain value; show honest empty collections and one clear next action. |
| Search | Label the field, preserve query, show no-results and clear/reset. |
| AI conversation | Distinct user/assistant turns, processing feedback, retry and text fallback. |
| Microphone | Ask only after a user action; explain permission; show recording, Stop, denial, and failure states. Never imply recording when none is active. |
| Draft review | Mark as Draft; show editable quantities and assumptions; offer Edit, Continue conversation, Approve & Save. |
| Saving | Show pending status; prevent duplicate submits; show Saved only after server confirmation. |
| Failed save | Preserve entered content, describe the failure, and provide retry. |
| Shopping | Whole-row comfortable checks; checkbox plus text/strikethrough; reversible; distinguish pending sync from persisted state. |
| Media | File-type/size feedback, progress, failure/retry, replacement/removal, and useful descriptions. |
| Recent shortcuts | Open the actual latest saved item; explain when none exists. |
| Offline | Clearly state what remains available and whether changes are pending; never claim cloud sync falsely. |
| Deletion | Explain consequences; require confirmation for destructive record/account actions. |

Checking groceries means **in the cart**, not purchased, consumed, or added to pantry inventory.

## 9. Motion, focus, and accessibility

- Use short, restrained transitions to explain state changes; avoid decorative looping motion.
- Respect `prefers-reduced-motion`; state changes must remain understandable without animation.
- Provide visible keyboard focus, logical focus order, accessible names, and focus return after closing a dialog.
- Announce meaningful status changes without reading every streaming token aloud.
- Make all core tasks possible without voice, sound, colour discrimination, hover, or custom gestures.
- Maintain useful text contrast when items are checked; do not make the grocery label unreadable.
- Keep overlays/dialogs keyboard accessible and prevent unintended interaction with underlying content.
- Treat VoiceOver and keyboard support as behaviour to verify, not a checkbox satisfied by adding ARIA everywhere.

## 10. App elements and reusable component contracts

Research checked: 16 November 2026. Apple HIG describes native interface components and behaviour; MDN and W3C describe the semantic HTML and accessibility implementation underneath Tally. **An HTML element is not a visual style.** Using `<header>`, `<p>`, or `<nav>` does not require website-like chrome, browser-default styling, or document reloads.

This is a practical Tally catalogue, not an exhaustive list of HTML or permission to add every possible component. These contracts are design/implementation requirements, not a claim that the current app has already passed an element-by-element audit.

### Semantic element catalogue

| Purpose | HTML foundation | Tally rule / example |
| --- | --- | --- |
| Screen content | `<main>` | One visible main content landmark for the active screen; name the screen clearly. |
| App/screen header | `<header>` | Native-style screen identity, Back, and contextual actions; not a desktop website masthead. A header is not itself a heading. |
| Screen and section titles | `<h1>`–`<h6>` | Prefer one `<h1>` for the active screen, then logical `<h2>`/`<h3>` sections. Choose level by hierarchy, not desired font size. |
| Body text | `<p>` | Recipe description, guidance, explanatory copy. Use consistent body typography rather than default browser margins. |
| Inline text | `<span>`, `<strong>`, `<em>`, `<small>` | Inline grouping, meaningful importance/emphasis, or secondary annotations. Do not use `<small>` as an excuse for unreadable text. |
| Thematic content groups | `<section>` with a heading | Ingredients, Method, account preferences; use `<div>` instead when grouping is purely for layout. |
| Self-contained content | `<article>` where appropriate | A standalone recipe can be an article; every decorative card does not need article semantics. |
| Neutral layout | `<div>`, `<span>` | Layout wrappers only; not substitutes for buttons, links, headings, or form labels. |
| Destination navigation | `<nav>` and `<a href>` / router links | Five bottom destinations with visible labels and `aria-current="page"` for the active destination. Use real URL/history behaviour without routine document reloads. |
| Actions | `<button>` | Save, Delete, retry, open a sheet, add an ingredient. Set `type="button"` unless submitting a form; give icon-only buttons an accessible action name. |
| Forms | `<form>` | Explicit recipe approval and other submissions; support keyboard submit, validation, pending state, and input preservation. |
| Labels and related fields | `<label>`, `<fieldset>`, `<legend>` | Associate labels with controls; group related choices. A placeholder is a hint, not the only label. |
| Short text / search / credentials | `<input>` with suitable `type` | Recipe title, search, email/password. Use suitable autocomplete and input purpose; auth remains Clerk-managed. |
| Quantities and numeric entry | `<input>` with suitable numeric semantics and `inputmode` | Servings and amounts; allow appropriate decimals, visible units, validation, and locale-aware entry. Never silently turn an unknown value into zero. |
| Long text | `<textarea>` | Method steps, notes, assistant composer; preserve wrapping, focus, keyboard access, and draft input. |
| Choice controls | `<select>`, `<option>`, labelled radio inputs | Unit choice or one-of-many preferences. A three-choice theme selector is not three unrelated on/off switches. |
| Checklist selection | Labelled `<input type="checkbox">` | Grocery check-off and recipe selection, with a generous row target. A toggle-button implementation must instead expose its actual pressed state consistently; don't present a decorative checkmark as a control. |
| Collections and steps | `<ul>`, `<ol>`, `<li>` | Ingredients/checklists/history as lists where appropriate; ordered method steps as an ordered list. |
| Label/value information | `<dl>`, `<dt>`, `<dd>` | Metadata such as servings, preparation duration, and account fields where a description list fits. |
| Truly tabular data | `<table>`, `<caption>`, `<th>`, `<td>` | Only real row/column relationships, not screen layout. Apple “table views” do not mean every native-looking list should be an HTML table. |
| Images and captions | `<img>`, `<figure>`, `<figcaption>` | Meaningful alternative text for informative images; empty alt for decorative ones. Keep user media distinct from illustration. |
| Icons | `<svg>` or an accessible icon component | Decorative icons are hidden from assistive technology; the enclosing action retains a readable name. Icons must not be the only unfamiliar state cue. |
| Audio/video, when implemented | `<audio>`, `<video>`, `<track>` | Real controls and appropriate text alternatives/captions; not fake playback or a claim that uploads already work. |
| Dates | `<time datetime="…">` | Human-readable list/save dates with a machine-readable timestamp where useful. |
| Progress | Labelled `<progress>` or correctly implemented progress semantics | Real upload/task/checklist progress; do not fabricate percentages or confuse progress with nutrition data. |
| Disclosure | `<details>`, `<summary>` where appropriate | Optional secondary explanation; do not hide essential approval details, ingredients, or core navigation. |
| Modal sheet / dialog | `<dialog>` opened modally, or a fully implemented accessible dialog | Label it, place and contain focus, make background content inert, support appropriate dismissal, and restore focus. Round corners alone do not make a native sheet. |
| Status and errors | Suitable text with `role="status"` / `aria-live`, or an appropriate alert | Announce saves, results, and relevant failures without moving focus unnecessarily. Reserve interruptive alerts for urgency; don't announce every streamed AI token. |
| Footer / supplementary content | `<footer>`, `<aside>` only when semantically appropriate | These tags are allowed, but do not introduce marketing footers, desktop sidebars, or extra app chrome just to use them. |

Sources: MDN element/heading/button/input references [M1–M4]; W3C landmarks, button, dialog, ARIA and status guidance [P1–P6, W3].

**Navigation is not automatically an ARIA tabs widget.** Tally's five route destinations use navigation links. Only use `tablist`/`tab`/`tabpanel` for an actual layered-panel widget and implement its full selection, focus, relationships, and keyboard model. Do not add `role="application"` to the whole app merely because Tally is an app. Prefer correct native HTML semantics; adding a role promises the corresponding behaviour, not just a visual appearance. [P1–P6]

### Apple HIG component guidance translated to Tally

| HIG component | Native behaviour to retain | Web implementation boundary |
| --- | --- | --- |
| Buttons [A8] | Recognisable actions, immediate press feedback, space around targets, restrained action prominence. | Use real buttons for actions; adapt appearance to Tally's opaque colour tokens. |
| Text fields [A9] | Short, specific input; persistent purpose/labels, appropriate validation, logical field order. | Use inputs for short values and textareas for long content; retain browser autofill and keyboard capabilities. |
| Toolbars/navigation [A10] | Orient people with useful current-view context, Back, and relevant actions; app name alone is not a useful title for every view. | Use semantic headers and appropriate links/buttons. No Liquid Glass material treatment. |
| Lists and tables [A11] | Clear grouping, scannable rows, concise labels, selection feedback appropriate to navigation versus toggling. | Choose list, checkbox, link, or table semantics according to meaning—not native control naming. |
| Alerts [A12] | Use sparingly for critical, actionable information or uncommon irreversible destruction. | Routine saved feedback stays inline/nonmodal; irreversible recipe/list deletion needs a clear confirmation. |
| Tab bars [A4] | Stable labelled destinations, preserved task state, navigation rather than automatic actions. | Keep the five routes and centred AI; selecting AI never starts recording. |

Current HIG material examples may use Liquid Glass; **only the applicable behavioural, hierarchy, and accessibility guidance is adopted**. Tally's solid-colour exclusion remains authoritative. Apple points and CSS pixels are not interchangeable; use the separately documented Tally hit-target rules.

### Consistency across components and implementation skills

Use one shared contract for each repeated pattern, rather than reinterpreting it on every screen:

- **Screen header/title:** same title hierarchy, Back placement, contextual-action treatment, and safe-area behaviour.
- **Buttons/icon buttons:** shared primary, secondary, destructive, loading, disabled, pressed, and focus states.
- **Fields and choices:** consistent labels, hints, units, validation, spacing, and keyboard behaviour.
- **Collection rows:** consistent title/metadata/chevron treatment for navigation; distinct checkable-row semantics for shopping.
- **Sheets/dialogs:** shared dismissal, focus/inertness, confirmation wording, and recovery behaviour.
- **Feedback:** consistent loading, empty, no-results, offline, error/retry, Draft, Saving, and Saved treatments.
- **Tokens:** reuse the same semantic colours, typography roles, spacing, radii, icon sizing, and motion conventions. Exact unapproved values remain design choices; do not invent separate theme systems for individual features.

Read this guide with `tally_specs.md` for every UI change. Apply the relevant implementation guidance **in addition**, not as a competing visual system:

**All participating implementation skills follow the same primary design reference: Apple HIG, within the user's explicit constraints.** Researching another source or using a third-party component does not authorise a different design direction.

| Implementation guidance | Consistency obligation |
| --- | --- |
| React/Vite and frontend conventions | Reuse component contracts and accessible semantics in JavaScript/JSX; preserve route, state, and responsive behaviour. |
| Design implementation | Pass both project guides and image references into the design brief; no generic restyling that ignores them. |
| Clerk auth | Sign-in, sign-up, and account states share Tally's typography, colours, surfaces, and interaction standards without weakening provider authentication. |
| AI integration | Conversation, recording when implemented, and draft approval use the same feedback/control patterns; provider output cannot invent layouts or save automatically. |
| Object storage/media | Future uploads use the same labelled controls, progress, error/retry and destructive-confirmation patterns while keeping media private. |
| Accessibility/testing | Verify semantics and behaviour, not screenshots alone. Use proportionate checks and follow the testing guidance's limits on browser runs. |

Project guide names here describe how to apply the relevant supplied skills; they do **not** claim that those platform-managed skill files were rewritten or that a global design-system library was installed.

## 11. Apply this guide

1. Read `tally_specs.md` and identify the exact journey being designed.
2. Separate confirmed requirements from recommendations and open choices.
3. Reuse semantic tokens and navigation patterns; never hardcode a second competing theme.
4. Include loading, empty, error, permission, approval, and success states with the main screen.
5. Check actual contrast pairs, focus, zoom, safe areas, keyboard behaviour, and reduced motion.
6. Verify phone layouts and, before release, real-device microphone/media and grocery flows.
7. Report what was implemented and tested separately from what is planned.

### Design acceptance checklist

- [ ] Native appearance **and interaction** pass real-phone review; “responsive website” is not an acceptable substitute.
- [ ] Apple HIG is the primary design basis; images inform its visual interpretation and NN/G remains supporting research.
- [ ] Interface glyphs use Hugeicons consistently, with coherent dimensions/strokes, semantic meaning, large hit areas, and accessible labels.
- [ ] Actual screens were compared against the supplied images for composition, hierarchy, grouping, controls, and spacing—not just food photography.
- [ ] Elements match their purpose: logical headings, labelled fields, navigation links for destinations, buttons for actions, and correctly exposed selection/status.
- [ ] Repeated controls and all supporting/auth/error screens use the same component contracts and semantic tokens.
- [ ] Sections group related content using appropriate list/detail patterns, deliberate spacing, aligned rows, optional local headers/footers, and restrained separators—not repeated website-style panels.
- [ ] Text enlargement, scrolling, sticky elements, safe areas, and keyboard changes preserve section relationships without hiding content or causing unnecessary nested scrolling.
- [ ] Dialog focus/inertness/dismissal and screen-reader status announcements behave correctly; ARIA is not used as styling.
- [ ] Routine navigation has no document reloads; tab/back navigation preserves relevant state.
- [ ] Press feedback, scrolling, transitions, keyboard, and sheets behave like an app without layout jumps or hover dependence.
- [ ] Installed launch is standalone; no website-style headers/footers or app-created browser chrome.
- [ ] Solid surfaces; no glass, backdrop blur, or translucent navigation.
- [ ] Orange light mode, gold replacing orange in dark mode, tertiary pink, and black/white foundation; tested labels, icons, and control boundaries.
- [ ] Five labelled tabs in the confirmed order; AI third/centred; tab selection never starts recording.
- [ ] Settings in the fifth tab; no required header duplication; honest AI recent-item shortcuts.
- [ ] Home feels native and uses only agreed modules and genuine data; wireframe suggestions are not mistaken for final requirements.
- [ ] Fixed-format readable recipes; quantities and assumptions remain visible.
- [ ] Explicit approval before a draft becomes a saved record.
- [ ] Grocery checks are obvious, reversible, and persist for the correct dated list.
- [ ] Large targets, keyboard access, visible focus, 200% text enlargement.
- [ ] Safe-area/keyboard handling; no hidden last rows or critical controls.
- [ ] Text fallback, recording/permission feedback, error recovery, reduced motion.
- [ ] Reference-only nutrition/scanning features have not been added.

## Sources

- **Primary design reference:** Apple Developer, [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/). Component-specific HIG sources are listed below; Tally excludes Liquid Glass styling.
- **Product addendum:** `attached_assets/AI_Kitchen_Native_App_Design_Update_v1_1_1794819465733.pdf`, pages 1–3: confirmed five-tab navigation, proposed Home modules, confirmed colour roles, provisional font, and non-binding framework/name suggestions.
- **[N1]** Nielsen Norman Group, [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).
- **[N2]** Nielsen Norman Group, [Basic Patterns for Mobile Navigation](https://www.nngroup.com/articles/mobile-navigation-patterns/).
- **[N3]** Nielsen Norman Group, [Touch Targets on Touchscreens](https://www.nngroup.com/articles/touch-target-size/).
- **[A1]** Apple Developer, [HIG: Color](https://developer.apple.com/design/human-interface-guidelines/color).
- **[A2]** Apple Developer, [HIG: Typography](https://developer.apple.com/design/human-interface-guidelines/typography).
- **[A3]** Apple Developer, [HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- **[A4]** Apple Developer, [HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars). Current Liquid Glass styling is excluded.
- **[A5]** Apple Developer, [HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials). Used to distinguish current Liquid Glass from Tally's requested treatment; not a styling instruction.
- **[A6]** Apple Developer Archive, [iOS 7 UI Transition Guide: Bars and Bar Buttons](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/TransitionGuide/Bars.html).
- **[A7]** Apple Developer Archive, [iOS 7 UI Transition Guide: Appearance and Behavior](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/TransitionGuide/AppearanceCustomization.html).
- **[W1]** W3C, [WCAG 2.2: Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- **[W2]** W3C, [WCAG 2.2: Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast).
- **[A8]** Apple Developer, [HIG: Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons).
- **[A9]** Apple Developer, [HIG: Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields).
- **[A10]** Apple Developer, [HIG: Toolbars](https://developer.apple.com/design/human-interface-guidelines/navigation-bars). The navigation-bars URL currently resolves to the Toolbars guidance; glass styling is excluded.
- **[A11]** Apple Developer, [HIG: Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables).
- **[A12]** Apple Developer, [HIG: Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts).
- **[M1]** MDN, [HTML elements reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements).
- **[M2]** MDN, [Heading elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements).
- **[M3]** MDN, [Button](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button).
- **[M4]** MDN, [Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input).
- **[P1]** W3C WAI APG, [Landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/).
- **[P2]** W3C WAI APG, [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).
- **[P3]** W3C WAI APG, [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
- **[P4]** W3C WAI APG, [Modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- **[P5]** W3C WAI APG, [No ARIA is better than bad ARIA](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/).
- **[P6]** W3C WAI APG, [Patterns overview](https://www.w3.org/WAI/ARIA/apg/patterns/).
- **[W3]** W3C, [WCAG 2.2: Status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).
- **[A13]** Apple Developer, [HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout). Adopt hierarchy, alignment, grouping, adaptability, and safe areas; exclude its Liquid Glass material treatment.
- **[A14]** Apple Developer, [HIG: Scroll views](https://developer.apple.com/design/human-interface-guidelines/scroll-views). Adopt scroll behaviour and context; exclude blur/material effects.
- **[A15]** Apple Developer, [HIG: Collections](https://developer.apple.com/design/human-interface-guidelines/collections).
- **[A16]** Apple Developer, [SwiftUI: Section](https://developer.apple.com/documentation/swiftui/section). Structural reference for grouping with optional headers/footers, not a Tally framework choice.
- **[A17]** Apple Developer, [WWDC20: Lists in UICollectionView](https://developer.apple.com/videos/play/wwdc2020/10026/), list appearances and configuration around 3:02–4:09.
- **[A18]** Apple Developer, [WWDC20: List separator alignment](https://developer.apple.com/videos/play/wwdc2020/10026/?time=542), around 9:02–11:19.
- **[I1]** Hugeicons, [Official documentation](https://hugeicons.com/docs) and the installed `@hugeicons/react` README: renderer, free Stroke Rounded package, 24×24 grid, size/colour/stroke props and accessible SVG use.

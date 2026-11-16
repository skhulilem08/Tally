---
name: tally-ui-design
description: Project-specific instructions for designing Tally's JavaScript PWA with accessible, solid-colour, iOS-inspired interfaces. Read with tally_specs.md before designing or changing Tally screens.
---

# Tally UI Design Guide

Research date: 16 November 2026  
Status: Research-informed implementation guidance; not evidence that the interface is implemented.  
Companion: [Tally product specification](tally_specs.md).

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

Apply requirements in this order:

1. The user's latest explicit instructions.
2. Confirmed product requirements in `tally_specs.md`.
3. This document's accessibility and interaction rules.
4. Attached reference imagery as visual inspiration.
5. Proposed defaults, which remain adjustable.

The architect reviewed the product constraints and the verified research before this guide was written. This is a project guide, not a claim of Apple endorsement or a globally installed Agent skill.

## 2. Research basis and historical boundary

### UX/UI specialist: Nielsen Norman Group

Use these researched principles:

| Principle | Apply it to Tally | Source |
| --- | --- | --- |
| Visibility of system status | Clearly distinguish listening, processing, draft, saving, saved, failed, and offline states. | [N1] |
| Match the real world | Use “Ingredients”, “Servings”, “In your cart”, and other familiar cooking/shopping language. | [N1] |
| User control and freedom | Provide Cancel, Back, Stop recording, correction, and reversible checklist actions. | [N1] |
| Error prevention | Require review before saving AI proposals; clarify quantities rather than invent them. | [N1] |
| Recognition rather than recall | Keep ingredient quantities visible during review and recent-item shortcuts available in the assistant. | [N1] |
| Discoverable navigation | Keep the three labelled destinations visible instead of hiding them in a hamburger menu. | [N2] |
| Comfortable touch | Use generous targets and spacing, especially during cooking and shopping. | [N3] |

NN/G discusses roughly **1 cm × 1 cm physical touch targets** and explains why physical context matters. Do not describe that as an exact number of CSS pixels; verify the rendered experience on real devices.

### Apple Developer guidance

Use Apple's enduring guidance on consistent interaction, semantic colour, readable typography, accessibility, and tab navigation. [A1–A5]

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

The user-supplied direction is **orange primary in light mode, gold primary in dark mode**, with pink support and neutral backgrounds. The following exact hex values are **proposed custom Tally tokens**, not approved final branding or Apple system-colour values.

| Token | Light | Dark | Intended role |
| --- | --- | --- | --- |
| `background` | `#F7F6F2` | `#111113` | Page canvas |
| `surface` | `#FFFFFF` | `#1C1C1E` | Cards, sheets, bars |
| `surface-inset` | `#EFEDE7` | `#28282B` | Inputs and grouped sections |
| `text` | `#191919` | `#F5F5F7` | Primary reading text |
| `text-secondary` | `#62625F` | `#B7B7BC` | Secondary information |
| `separator` | `#D9D7D1` | `#45454B` | Decorative division only |
| `control-outline` | `#787872` | `#85858C` | Essential unfilled-control boundaries |
| `accent-fill` | `#FF771C` | `#E9B748` | Primary action fill |
| `on-accent` | `#191919` | `#191919` | Text/icons on accent fills |
| `accent-text` | `#B54400` | `#E9B748` | Interactive text and essential accent icons |
| `support-pink` | `#F0A5BE` | `#F2AAC4` | Restrained secondary emphasis |

### Colour-use rules

- Give a colour one consistent semantic purpose. Selection, danger, and success must not become interchangeable. [A1]
- Orange/gold are brand/action accents, not automatic warnings or nutrition indicators.
- Use pink as supporting colour, not the sole indicator of an actionable control or state.
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
| `#191919` / `#FF771C` | 6.62:1 | Dark label on orange button |
| `#FFFFFF` / `#FF771C` | 2.66:1 | **Do not use for normal button text** |
| `#B54400` / `#FFFFFF` | 5.54:1 | Accessible light-mode accent text |
| `#191919` / `#E9B748` | 9.49:1 | Dark label on gold button |
| `#B7B7BC` / `#1C1C1E` | 8.52:1 | Secondary dark text |
| `#787872` / `#FFFFFF` | 4.44:1 | Essential light control outline |
| `#85858C` / `#1C1C1E` | 4.64:1 | Essential dark control outline |

Orange `#FF771C` against white is also only 2.66:1: it cannot be the only essential icon or control boundary there. Use `accent-text`, a qualifying outline, or another tested treatment. Low-contrast separators are decorative, not checkbox borders or focus indicators.

For this web app, use WCAG 2.2 thresholds: normal text ≥4.5:1; large text ≥3:1 only at ≥24 CSS px regular or ≥18.67 CSS px bold; essential non-text controls/states ≥3:1 against adjacent colours. Small bold text does **not** automatically qualify as large text. [W1, W2]

## 5. Typography and hierarchy

- On iOS, use the system font through `-apple-system`, `BlinkMacSystemFont`, and appropriate system fallbacks. Do not bundle an unlicensed SF Pro font file.
- Use Plus Jakarta Sans for the Android-oriented treatment, with a system/sans-serif fallback if loading fails.
- Prefer readable regular/medium text; use semibold for important actions and headings. Avoid ultralight recipe instructions.
- Proposed web scale: body 17 CSS px (`1.0625rem` with a default 16px root), supporting text 15–16px, metadata 13–15px, section titles 20–22px, screen titles 28–34px.
- These web sizes are **Tally design choices**, not a literal conversion of Apple's point sizes. Apple's current guidance lists a 17pt default iOS text size. [A2, A3]
- Use relative font sizing, comfortable line height, and wrapping. Support at least 200% text enlargement/zoom without hiding quantities or actions.
- Preserve hierarchy at large text sizes; stack information rather than truncating important labels.
- Do not disable pinch zoom or rely on native Dynamic Type APIs that the PWA does not implement.

## 6. Navigation and screen behaviour

- Exactly three persistent, labelled bottom destinations: **Cookbook | AI Assistant | Groceries**.
- Emphasise the centre AI destination without reducing the other targets or obstructing content.
- A tab navigates; it does not immediately start recording, save, scan, or create an item. [A4]
- Preserve search, scroll position, and meaningful task state when switching destinations.
- Keep all destinations available even when their collections are empty; explain empty states rather than disabling tabs.
- Use a solid tab bar with a visible active state, icon, label, and safe-area padding.
- Settings uses the consistent upper-right entry specified by the blueprint. The AI screen also has recent-recipe and recent-list shortcuts.
- Recipe details, list details, account screens, and editors are secondary screens, not additional bottom tabs.
- Use familiar Back/Cancel controls and browser history. Gestures are optional shortcuts, never the only way out.

The screenshot's “AI third” and “Settings no longer ... every page” text conflicts with the PDF. The working basis remains the previously communicated blueprint arrangement; flag the conflict rather than silently treating the screenshot as a final navigation revision.

## 7. Touch, layout, and PWA constraints

- Tally's chosen minimum interactive hit area is **44 × 44 CSS px**; prefer 48–56px for frequent/primary actions and comfortable full-width grocery rows.
- Apple's current table lists **44 × 44pt default** and **28 × 28pt minimum** controls for iOS/iPadOS. Do not call 44pt its current minimum. CSS pixels, Apple points, and device pixels are different units. [A3]
- Provide spacing between competing targets; enlarge the hit area around small visible icons.
- Keep destructive actions away from frequent checklist and microphone controls.
- Use safe-area insets and sufficient bottom content padding so the final row is never hidden by navigation.
- Accommodate the virtual keyboard; keep message input, current field, and submit control visible.
- Use real buttons, links, labels, headings, lists, and form controls rather than clickable generic containers.
- Responsive web layouts must work on phones, tablets, and desktop without horizontal scrolling or fake device frames.
- Installation hints must match the browser and appear only when relevant. Do not promise universal browser install prompts, background recording, or native haptics.

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

## 10. Apply this guide

1. Read `tally_specs.md` and identify the exact journey being designed.
2. Separate confirmed requirements from recommendations and open choices.
3. Reuse semantic tokens and navigation patterns; never hardcode a second competing theme.
4. Include loading, empty, error, permission, approval, and success states with the main screen.
5. Check actual contrast pairs, focus, zoom, safe areas, keyboard behaviour, and reduced motion.
6. Verify phone layouts and, before release, real-device microphone/media and grocery flows.
7. Report what was implemented and tested separately from what is planned.

### Design acceptance checklist

- [ ] Native appearance **and interaction** pass real-phone review; “responsive website” is not an acceptable substitute.
- [ ] Routine navigation has no document reloads; tab/back navigation preserves relevant state.
- [ ] Press feedback, scrolling, transitions, keyboard, and sheets behave like an app without layout jumps or hover dependence.
- [ ] Installed launch is standalone; no website-style headers/footers or app-created browser chrome.
- [ ] Solid surfaces; no glass, backdrop blur, or translucent navigation.
- [ ] Orange light mode and gold dark mode; tested labels, icons, and control boundaries.
- [ ] Three labelled tabs; AI centred; tab selection never starts recording.
- [ ] Upper-right Settings and honest recent-item shortcuts.
- [ ] Fixed-format readable recipes; quantities and assumptions remain visible.
- [ ] Explicit approval before a draft becomes a saved record.
- [ ] Grocery checks are obvious, reversible, and persist for the correct dated list.
- [ ] Large targets, keyboard access, visible focus, 200% text enlargement.
- [ ] Safe-area/keyboard handling; no hidden last rows or critical controls.
- [ ] Text fallback, recording/permission feedback, error recovery, reduced motion.
- [ ] Reference-only nutrition/scanning features have not been added.

## Sources

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

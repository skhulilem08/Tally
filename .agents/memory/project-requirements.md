---
name: Project requirements
description: User-confirmed platform and language requirements.
---

Use JavaScript, not TypeScript, for Tally.

**Why:** The user explicitly requested the Vite React JavaScript template and repeated that it must not use TypeScript.

**How to apply:** Use `.js` and `.jsx` for application source and configuration.

Tally is delivered as a PWA, but it must never look or feel like a PWA; it must look and feel native.

**Why:** The user clarified “PWA but native interface or design”, then emphasised: “it must never ever look or feel like a pwa but must and I mean must look and feel native”.

**How to apply:** Preserve the web platform and JavaScript requirement, but treat native appearance and interaction as a strict acceptance gate, not an optional styling preference. Apply it to supporting screens and real-phone behaviour, not screenshots alone.

Use solid-colour, iOS 7+ inspired design for Tally, not Liquid Glass.

**Why:** The user explicitly requested Apple design principles, clarified “7+”, and specified “solid color not Liquid Glass”. They also clarified that the attached images are part of the native look-and-feel reference and design guide.

**How to apply:** Read the project-root `ui_design_skill.md` and `tally_specs.md` before further app implementation. Apply the supplied images to screen composition, hierarchy, grouped surfaces, spacing, and controls—not just food photography—while preserving confirmed navigation, palette, and no-glass constraints.

Use five bottom tabs in this order: Home, Cookbook, AI Assistant, Groceries, Settings. AI is third, centred, and most prominent; Settings does not need repeating in headers. Keep both recent-item shortcuts in AI.

**Why:** The user supplied a design addendum to update the Markdown specifications; it explicitly supersedes the original three-tab navigation.

**How to apply:** Treat the old three-tab layout and unspecified fifth page as superseded. Home is confirmed, but its module selection remains proposed. The addendum's Expo/TypeScript recommendation and unselected name ideas do not override the user's JavaScript/PWA and Tally choices.

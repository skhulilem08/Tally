---
name: Project requirements
description: User-confirmed delivery, native design, and guest-storage requirements for Tally.
---

Use JavaScript, not TypeScript, for Tally.

**Why:** The user explicitly requested the Vite React JavaScript template and repeated that it must not use TypeScript.

**How to apply:** Use `.js` and `.jsx` for application source and configuration.

Tally is delivered as a PWA, but it must never look or feel like a PWA; it must look and feel native.

**Why:** The user clarified “PWA but native interface or design”, then emphasised: “it must never ever look or feel like a pwa but must and I mean must look and feel native”.

**How to apply:** Preserve the web platform and JavaScript requirement, but treat native appearance and interaction as a strict acceptance gate, not an optional styling preference. The target is specifically iOS, not generic mobile styling. Apply it to supporting screens and real-phone behaviour, not screenshots alone.

Keep routine interface copy concise; do not surround familiar controls with redundant website-style explanations.

**Why:** The user repeatedly rejected the existing design as insufficiently native/iOS and asked why elements had explanatory text.

**How to apply:** Remove unnecessary taglines, repeated descriptions, and routine helper paragraphs. Retain essential field labels, quantities/units, error/recovery, privacy, and approval/destructive-action information.

Use Apple HIG as Tally's primary design reference, with solid-colour, iOS 7+ inspired design and no Liquid Glass.

**Why:** The user stated, “Hig is our primary ref for design skills”, requested Apple design principles, clarified “7+”, and specified “solid color not Liquid Glass”. They also clarified that the attached images are part of the native look-and-feel reference and design guide.

**How to apply:** Read the project-root `ui_design_skill.md` and `tally_specs.md` before further app implementation. Apple HIG leads design decisions within the user's explicit constraints; supplied images guide native visual interpretation, and NN/G is supporting UX research. MDN/W3C govern web semantics and accessibility. Apply this hierarchy consistently across implementation skills.

Use Iconoir for Tally's interface icons, choosing glyphs close in character to iOS icons.

**Why:** The user requested, “Use iconnoir for icons that are close to iOS icons”.

**How to apply:** Keep interface icons in one coherent Iconoir family across screens; preserve accessible names and sufficient touch targets. This is not a request to use Apple SF Symbols or replace custom brand artwork.

Allow guest access with recipes and grocery lists saved on this device.

**Why:** The user requested guest access and selected “Save on this device (recommended)”, rather than browse-only access.

**How to apply:** Preserve guest use without an account and keep its local records separate from signed-in cloud kitchens. Do not silently merge/upload guest records or erase them on sign-in/sign-out. Explain the absence of cloud backup without cluttering routine controls.

Use five bottom tabs in this order: Home, Cookbook, AI Assistant, Groceries, Settings. AI is third, centred, and most prominent; Settings does not need repeating in headers. Keep both recent-item shortcuts in AI.

**Why:** The user supplied a design addendum to update the Markdown specifications; it explicitly supersedes the original three-tab navigation.

**How to apply:** Treat the old three-tab layout and unspecified fifth page as superseded. Home is confirmed, but its module selection remains proposed. The addendum's Expo/TypeScript recommendation and unselected name ideas do not override the user's JavaScript/PWA and Tally choices.

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

Use the supplied PocketBook Settings image as the Settings-specific visual target.

**Why:** After rejecting earlier Settings work as not high-end iOS, the user supplied the light/dark Settings image and said, “This design and loook and feel for settings”.

**How to apply:** Follow the image referenced in `ui_design_skill.md` for native grouping, compact toolbar and monochrome treatment; adapt the content to real Tally settings rather than adding finance-app controls.

Preserve the approved Settings direction, with rounder corners and more solid whites and iOS-like colours.

**Why:** The user responded “Nice” to the reference-based design, then requested increased border radius and more solid colours using HIG as reference.

**How to apply:** Refine rather than replace the Settings layout. Keep opaque neutral light/dark surfaces and the no-glass constraint.

Use Settings' approved visual system for Home, and the Home screenshot only for section arrangement—not product sections or a different theme.

**Why:** The user directed Home content back to the PDF-derived specs, then corrected the interpretation: “the look and feel and design must match setting as for section structure match the img i sent you”.

**How to apply:** Reuse Settings' palette, rounded solid surfaces, icons and control treatment. Follow the Home image for the arrangement of real greeting/recipe/list/assistant content from the specs. Do not introduce ecommerce features or redesign Settings.

Preserve the accepted native Home composition while refining its controls.

**Why:** The user explicitly said, “i like the native home design”, then asked for the links and buttons to follow HIG guidance.

**How to apply:** Keep the layout and shared Settings visual language; refine action hierarchy, navigation affordances, labels, hit areas and interaction states rather than redesigning Home again.

Use the small Cookbook/All lists chevrons consistently for Home navigation labels, not straight arrows.

**Why:** The user preferred those chevrons over the arrows beside Sign in, Add recipe and Plan groceries.

**How to apply:** Keep these navigation affordances in the shared Hugeicons family without changing their destinations or the accepted Home layout.

Use solid filled components, not decorative outlined cards or controls.

**Why:** The user explicitly instructed, “No outline ... on component as they are solid”.

**How to apply:** Avoid decorative card borders and outlined chips/buttons. Keep the approved native row separators and accessible keyboard focus indicators, which serve different purposes.

Use Apple HIG as Tally's primary design reference, with solid-colour, iOS 7+ inspired design and no Liquid Glass.

**Why:** The user stated, “Hig is our primary ref for design skills”, requested Apple design principles, clarified “7+”, and specified “solid color not Liquid Glass”. They also clarified that the attached images are part of the native look-and-feel reference and design guide.

**How to apply:** Read the project-root `ui_design_skill.md` and `tally_specs.md` before further app implementation. Apple HIG leads design decisions within the user's explicit constraints; supplied images guide native visual interpretation, and NN/G is supporting UX research. MDN/W3C govern web semantics and accessibility. Apply this hierarchy consistently across implementation skills.

Use Hugeicons for Tally's interface icons.

**Why:** The user explicitly changed the earlier Iconoir choice: “Switch from iconoir to huge icons icons”.

**How to apply:** Keep interface icons in one coherent Hugeicons family across screens; preserve iOS-appropriate meanings, accessible names and sufficient touch targets. Do not reintroduce Iconoir or replace custom brand artwork as part of an interface-icon change.

Allow guest access with recipes and grocery lists saved on this device.

**Why:** The user requested guest access and selected “Save on this device (recommended)”, rather than browse-only access.

**How to apply:** Preserve guest use without an account and keep its local records separate from signed-in cloud kitchens. Do not silently merge/upload guest records or erase them on sign-in/sign-out. Explain the absence of cloud backup without cluttering routine controls.

Use IndexedDB for future local-first storage with architect guidance; include truthful sync tracking in Settings when that feature is implemented.

**Why:** The user chose “IndexedDB ... with architect guidance” and asked for sync to be trackable in Settings, then explicitly deferred implementation to focus on Settings design.

**How to apply:** Keep the decision and safety requirements in `indexeddb_sync_plan.md`. Do not resume the deferred implementation or add simulated sync controls during design-only work.

Review JavaScript-coordinated database operations for SQL-enforced atomicity and race protection before future backend/storage work.

**Why:** The user said some operations implemented in JavaScript should have been SQL to be atomic and robust, and explicitly asked to document this for later.

**How to apply:** Follow the deferred review in `tally_specs.md`; assess transaction boundaries, constraints, concurrency and idempotency rather than assuming a JavaScript-to-SQL rewrite alone removes races. This is deferred work, not permission to implement it now.

Use five bottom tabs in this order: Home, Cookbook, AI Assistant, Groceries, Settings. AI is third, centred, and most prominent; Settings does not need repeating in headers. Keep both recent-item shortcuts in AI.

**Why:** The user supplied a design addendum to update the Markdown specifications; it explicitly supersedes the original three-tab navigation.

**How to apply:** Treat the old three-tab layout and unspecified fifth page as superseded. Home is confirmed, but its module selection remains proposed. The addendum's Expo/TypeScript recommendation and unselected name ideas do not override the user's JavaScript/PWA and Tally choices.

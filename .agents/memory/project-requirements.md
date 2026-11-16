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

**Why:** The user explicitly requested Apple design principles, clarified “7+”, and specified “solid color not Liquid Glass”.

**How to apply:** Read the project-root `ui_design_skill.md` and `tally_specs.md` before further app implementation. They distinguish the user's requirements from researched recommendations and attachment conflicts.

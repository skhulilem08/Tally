---
name: Project requirements
description: User-confirmed platform and language requirements.
---

Use JavaScript, not TypeScript, for Tally.

**Why:** The user explicitly requested the Vite React JavaScript template and repeated that it must not use TypeScript.

**How to apply:** Use `.js` and `.jsx` for application source and configuration.

The kitchen app should be a PWA with a native-style interface, not an Expo app.

**Why:** The user clarified, “PWA but native interface or design”.

**How to apply:** Preserve the web platform when developing the kitchen app.

Use solid-colour, iOS 7+ inspired design for Tally, not Liquid Glass.

**Why:** The user explicitly requested Apple design principles, clarified “7+”, and specified “solid color not Liquid Glass”.

**How to apply:** Read the project-root `ui_design_skill.md` and `tally_specs.md` before further app implementation. They distinguish the user's requirements from researched recommendations and attachment conflicts.

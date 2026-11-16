---
name: Preview routing verification
description: Legacy forwarding can change during workflow management; localhost alone is not sufficient verification.
---

Verify Tally through the public development preview proxy after workflow or package-management changes, not just through localhost.

**Why:** The React frontend responded successfully locally while Preview reached the API and returned “Cannot GET /”. On another occasion, an unrelated auxiliary Node listener was auto-selected and the public UI and API both returned plain “Running”, despite healthy Tally services. A managed workflow restart can regenerate `.replit` without its validated legacy port mapping.

**How to apply:** Check the proxied root, a client-side deep link, and the API's expected signed-out response after the final restart. If the frontend works locally but Preview returns API HTML, plain “Running”, or a gateway error, inspect forwarding before restarting again. Keep the public mapping directed at Tally's frontend, not an auxiliary listener, and check that the required mapping survived workflow management. A reachable development listener must not become a bare-API or helper-service dead end when Preview selects it.

A passing production build and HTTP 200 HTML are not sufficient after replacing frontend dependencies.

**Why:** Vite retained an uninstalled icon library in its development optimizer and returned failed module responses for the replacement icons, leaving a blank page despite a successful production build.

**How to apply:** Verify the actual rendered Preview and its module responses after dependency-family changes; distinguish optimizer/cache failures from forwarding failures before changing ports.

Test guest-to-account isolation on the **same origin and browser context** throughout.

**Why:** The supported Clerk test helper returned a public development-domain sign-in URL while the initial guest records were created on localhost. Comparing those separate storage origins falsely appeared to prove account isolation.

**How to apply:** Create the guest record on the public development origin, sign in there, verify it is absent from the authenticated kitchen, then sign out there and verify the same local record returns.

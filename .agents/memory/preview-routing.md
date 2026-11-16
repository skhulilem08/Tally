---
name: Preview routing verification
description: Legacy forwarding can change during workflow management; localhost alone is not sufficient verification.
---

Verify Tally through the public development preview proxy after workflow or package-management changes, not just through localhost.

**Why:** The React frontend responded successfully locally while Preview reached the API and returned “Cannot GET /”. A managed workflow restart also regenerated `.replit` without its manually validated legacy port mapping.

**How to apply:** Check the proxied root, a client-side deep link, and the API's expected signed-out response after the final restart. If the frontend works locally but Preview returns API HTML or a gateway error, inspect forwarding before restarting again. Check that any required mapping survived workflow management. Keep development-only backend listeners private.

---
name: Voice conversation usage budgets
description: Keep a normal multi-stage voice conversation within bounded provider usage.
---

Budget live voice per provider stage or completed turn, not with one shared request counter across recognition, model replies and speech playback.

**Why:** A spoken turn makes three provider-stage requests. A shared limit intended for conversation turns can stop an otherwise normal call much earlier, including during playback.

**How to apply:** Preserve bounded per-account/per-guest usage, payload limits and timeouts. Verify several consecutive full turns in the same window and verify that exhaustion remains enforced; do not fix a conversation failure by removing all limits.

---
name: Assistant memory correction safety
description: Preserve independent preferences when correcting a misheard voice turn.
---

Correcting a transcript must undo only automatic memory derived from the superseded conversation, never clear the whole personal profile. A deliberate Settings memory edit establishes an independent baseline.

**Why:** A correction to one misheard sentence must not delete preferences saved before that conversation or overwrite later explicit edits.

**How to apply:** Attribute automatic changes to their source turn and undo them in reverse order while preserving independent values. Keep provenance bounded with the private state; if a safe rollback is no longer possible, reject the old correction explicitly rather than guessing or wiping memory. Forgetting all memory remains a separate confirmed action.

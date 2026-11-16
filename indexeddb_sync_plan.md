# Tally — Deferred IndexedDB and cloud sync plan

**Status: documented for later. Not implemented or active.**

The user chose IndexedDB with architect guidance, then explicitly paused that implementation to prioritise the Settings design. Do not resume it without a new request.

## Intended behaviour

- Guests keep a device-only kitchen; never upload or merge it merely because someone signs in.
- Signed-in users read and save on the device first, then synchronise with their private cloud account.
- Make each saved change and its pending-sync operation durable in one IndexedDB transaction before showing success.
- Receive other-device changes through two-way sync while connected. Local speed is not proof of fresh cloud data.
- Retain pending changes offline and retry with the same operation IDs after reconnection.
- AI chat still requires an account and connection.

## Architect guidance

Before implementing this plan, complete the [deferred SQL atomicity review in tally_specs.md](tally_specs.md#deferred-sql-atomicity-and-race-condition-review). The user specifically requested revisiting JavaScript-coordinated operations that need database-enforced atomicity and race protection. Keep cloud transactions and browser IndexedDB transactions distinct.

1. Keep guest and each account in separate storage partitions. Hide the old account immediately on auth changes, stop its sync loop, and reject late responses. Bind queued operations to their original account; the server must still derive authorisation from the authenticated session.
2. Migrate existing guest localStorage data only after validation. Preserve IDs and request mappings; commit and verify the IndexedDB import before retiring the original. Never silently reset corrupt, blocked or full storage.
3. Store an immutable outbox alongside the visible data. A successful local save is not a successful cloud sync.
4. Add an authenticated transactional sync endpoint. Suggested request: account binding, baseline revision and bounded mutations with stable operation/entity IDs. Suggested response: consistent full account snapshot, revision and acknowledged operation IDs.
5. Serialize writes per account, validate payloads, and commit data plus idempotency receipts together. Lost responses must not duplicate recipes, lists, checks or deletions. Reject reuse of an operation ID with different content.
6. Include legacy write paths in revision/conflict handling or deliberately retire them. Deletions must be observable; do not rely only on records that still exist.
7. Merge acknowledgements and the remote snapshot atomically, preserving every operation queued during an in-flight request. Coordinate multiple tabs.
8. Preserve conflicting local edits and ask for a deliberate resolution instead of silently overwriting either version. Clearly confirm destructive choices and retain a recovery/export path.
9. Preview groceries offline using the shared deterministic calculator. Validate approved recipe content, quantities, warnings and stable item IDs again at sync. Storage timestamps must not invalidate identical recipe content.
10. Warn before signing out with pending changes. Protect account caches on shared devices; never expose them in Guest mode.

## Settings sync tracking — future feature

When sync is implemented, Settings must show:

- Actual state: saved on device, syncing, up to date, offline, sign-in required, failed, or conflict.
- Pending-change count.
- Last **successful** sync time.
- A working **Sync Now** action.
- Actionable retry and conflict resolution, without routine explanatory paragraphs.

Do not show invented “Synced”, pending counts, timestamps, or a non-working Sync Now control in the current Settings redesign.

## Verification before enabling

Test guest migration and failure recovery, local persistence across reloads, offline edits, reconnection, response loss, idempotent retries, changes made during sync, concurrent tabs/devices, conflicts, deletions, grocery approvals/checks, and sign-out/account switching. Guest/account isolation must be tested on the same origin and browser context.

**Current storage remains unchanged:** guest kitchens use localStorage; signed-in kitchens use the existing authenticated cloud API. Full offline cold launch also depends on the app shell and a safely resolved authentication session; IndexedDB alone does not provide it.

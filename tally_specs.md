# Tally — Product and Implementation Specification

Compiled: 16 November 2026  
Status: Consolidated specification, not a claim of completed implementation.  
Design companion: [ui_design_skill.md](ui_design_skill.md).

## 1. Inputs and precedence

This specification combines:

1. The user's direct instructions: app name **Tally**; React + Vite **JavaScript, not TypeScript**; **PWA with a native interface/design**; consult an architect before proceeding; research UX/UI and Apple **iOS 7+ design principles**; use **solid colours, not Liquid Glass**.
2. `attached_assets/AI_Kitchen_App_Project_Blueprint_1794818578896.pdf`, *AI Kitchen — Product & Development Blueprint*, version 1.0, 15 November 2026, seven pages.
3. `attached_assets/IMG_1978_1794818558866.png`, colour, typography, navigation, and native-implementation reference.
4. `attached_assets/IMG_1974_1794818558868.webp`, native-app visual reference for screen composition, hierarchy, solid surfaces, control styling, navigation treatment, and food photography.
5. `attached_assets/IMG_1975_1794818558868.webp`, native-app visual reference for grouped information, rounded surfaces, touch controls, spacing, and food-led detail screens.
6. **Apple Human Interface Guidelines (HIG), the primary external design reference**, with supporting Nielsen Norman Group UX research and MDN/W3C implementation guidance, cited in `ui_design_skill.md`. The initial Apple/NN/G research was reviewed with the architect.
7. `attached_assets/AI_Kitchen_Native_App_Design_Update_v1_1_1794819465733.pdf`, *Specification Addendum 01 — Native-first app, five-tab navigation*, 15 November 2026, three pages. This update supersedes the original navigation and resolves the related screenshot conflicts.

The user's direct clarifications override recommendations in the attachments. For product/design changes, the new addendum supersedes the original blueprint where they differ. Its native-framework recommendation does not override the user's explicit JavaScript/PWA stack choice. Reference imagery does not automatically add product features. Recommendations and open decisions below are deliberately distinct from confirmed scope.

**User clarification:** the supplied images are part of the **native look-and-feel reference and the design guide**, not merely examples of food photography. Use them when designing and reviewing actual Tally screens. A generic interface that ignores their visual direction does not satisfy that intent; exact pixel-for-pixel copying is not required.

### Requirement labels

- **Confirmed:** directly stated in the blueprint/addendum's confirmed requirements or by the user.
- **Design direction:** supplied by the user/reference images; exact visual implementation remains adjustable.
- **Recommended:** proposed in the blueprint or by the architect; not silently promoted to confirmed scope.
- **Open:** leave flexible until the user decides or a specific implementation needs clarification.

## 2. Product vision

**Confirmed:** Tally is a private, personal AI cookbook and grocery companion for the meals a person actually cooks.

People explain recipes naturally instead of entering everything into rigid forms. The assistant organises that information into an app-defined recipe format, asks about missing details, and waits for approval before saving. Before shopping, it compares cooking requirements with reported fridge/cupboard contents to propose a reviewable grocery list.

The cookbook and grocery history must remain useful without an active AI conversation. The experience should be premium, refined, calm, mobile-first, and exceptionally easy to use.

### Product invariants

- The AI proposes; the user reviews, corrects, and explicitly approves.
- App code controls recipe structure and presentation. AI fills validated fields, not arbitrary layouts or executable code.
- Each signed-in person's data is private to their account.
- Critical quantities, servings, and uncertain inventory must not be quietly invented.
- The product supports natural conversation and aims to support informal/multilingual speech; actual language quality needs testing.
- Grocery arithmetic is deterministic and only combines compatible ingredients and units.
- A grocery check means “placed in cart”, not “purchased” or “restocked”.

### Strict native-experience requirement

**Confirmed and non-negotiable:** the user states that Tally “must never ever look or feel like a pwa” and “must look and feel native”.

The PWA is the delivery mechanism only; the product experience must be native in appearance and interaction. A responsive website or a desktop dashboard adapted to a narrow viewport does not meet acceptance criteria.

This applies to every main and supporting screen: navigation/back behaviour, state preservation, touch feedback, transitions, scrolling, text entry, keyboard handling, safe areas, sheets/dialogs, loading, errors, and installed launch. Follow the concrete native-experience release gate in `ui_design_skill.md`.

Browser-controlled UI and native-only capability restrictions must be disclosed honestly. They do not relax the requirement for everything inside Tally, and they must not be disguised with fake functionality.

## 3. Platform and technology

| Area | Requirement / status |
| --- | --- |
| Name | **Confirmed:** Tally. “AI Kitchen” was a placeholder. |
| App form | **Confirmed:** PWA delivery; strictly native appearance and behaviour, not merely a native-styled website. |
| Frontend | **Confirmed:** Vite + React, JavaScript/JSX. |
| Language constraint | **Confirmed:** no TypeScript application source or TypeScript migration. |
| Visual material | **Confirmed:** solid colours/opaque surfaces; no Liquid Glass. |
| API | **Recommended:** Node.js + Express, server-side validation and authorisation. |
| Structured storage | **Recommended:** PostgreSQL, account-scoped records. |
| Media | **Recommended:** private object storage, owner-authorised upload/read access. |
| Authentication | Accounts are **confirmed**; the first development build includes branded Clerk sign-in/sign-up, account/sign-out screens, and session-scoped API ownership. Login-provider configuration remains adjustable. |
| AI | The first development build integrates OpenAI text conversation and structured recipe drafts with separate approval. Voice is not yet implemented. |
| Object storage | Provisioned infrastructure is not evidence of working media uploads. |

React Native/Expo/TypeScript appears as a recommendation in the screenshot and addendum, not a confirmed stack. The user's PWA and JavaScript instructions remain authoritative. Native look and feel remains mandatory across every screen, including Home.

PWA installation must use a valid manifest, suitable icons, secure hosting, and browser-appropriate installation guidance. Define caching deliberately; installation does not imply offline AI, automatic background recording, or full offline sync.

## 4. Navigation and information architecture

**Confirmed by the new addendum:** replace the original three-tab arrangement with five bottom tabs, in this exact order:

| Destination | Position | Purpose |
| --- | --- | --- |
| Home | First tab | Native kitchen home with genuine saved-recipe/meal promotion and most-opened recommendations. |
| Cookbook | Second tab | Search and browse personal saved recipes. |
| AI Assistant | Third tab, centred, strongest emphasis | Conversational recipe capture and grocery planning. |
| Groceries | Fourth tab | Current/latest approved list and dated history. |
| Settings | Fifth tab | Account access and relevant preferences; profile/account details are nested screens. |

- Exactly five visible bottom destinations: **Home | Cookbook | AI Assistant | Groceries | Settings**.
- AI remains centred because it is the third of five tabs.
- Settings is accessible from its tab; it no longer needs to be repeated in the main-page headers.
- AI screen retains direct shortcuts to the most recently saved recipe and grocery list.
- Recipe details, individual grocery lists, profile/account settings, sign-in/register, and editing/review flows are nested screens, not extra bottom tabs.
- Open details from their parent tab or an AI shortcut and preserve a coherent return path.
- Tab selection only navigates. Selecting AI must never start microphone recording.
- Preserve destination state and provide accessible labels and back navigation.

### Changes and resolved attachment conflicts

| Earlier requirement or recommendation | Current requirement |
| --- | --- |
| Original three bottom tabs and unspecified fifth page. | Superseded: five named tabs, including dedicated Home and Settings. |
| PNG says AI “stays third”; original PDF says centre. | Resolved: third and centred in the five-tab bar. |
| Original PDF requires upper-right Settings on three pages. | Superseded: Settings is the fifth tab; repeated header shortcut is not required. |
| Screenshot/addendum recommends Expo/TypeScript. | Recommendation only; keep the explicitly chosen PWA + JavaScript stack. |
| Addendum lists possible names as unselected. | The user already chose Tally; do not reopen the name or use a suggested alternative. |
| Earlier documents leave colour families open. | Addendum confirms light orange, dark gold replacing orange, tertiary pink, and black/white secondary foundation. Exact shades remain adjustable. |

### Home screen

**Confirmed:** a dedicated Home tab that looks and behaves like a premium native app's home screen. It is not a website landing page or busy dashboard.

**Confirmed personal promotion:** Home promotes the recipes and meals already saved in the current kitchen, not a fabricated catalogue or generic advertisement. Keep the promotion and recommendation sections visible even without content; concise empty-state text must explain that the user's recipes/meals will appear there. Recommend existing recipes by how often their detail pages are opened, with recent opens breaking ties. Opening is a proxy for cooking interest, not confirmation that a meal was cooked. Opening history is device-local and separated by guest/account; it is not cloud-synchronised cooking history. Deleted and unopened recipes must not be shown as most-opened recommendations.

**Existing modules and optional extensions:**

- **Welcome header:** short personal greeting and uncluttered identity.
- **Continue cooking:** one-tap return to the latest recipe's details; no invented cooking-progress tracking.
- **Latest grocery list:** reopen the current list without searching history.
- **Talk to your AI:** navigate to a conversation, with voice starting only after an explicit microphone action.
- **Quick kitchen overview:** optional summaries based on real saved activity; never fabricate inventory quantities.

The addendum's Home wireframe is illustrative, not final UI. If a proposed module is adopted, supply honest no-recipe/no-list states rather than sample personal activity presented as real.

**Home visual reference:** the user supplied `attached_assets/IMG_1984_1794827303234.webp` for the native **section arrangement**, explicitly **not its ecommerce sections**. The user clarified that Home's **look, feel and visual system must match the approved Settings design**, not introduce a new theme. Use the kitchen modules above, solid filled components without decorative outlines, and the interpretation in `ui_design_skill.md`; preserve Settings itself.

## 5. Cookbook

### Confirmed behaviour

- Browse the signed-in person's saved recipes.
- Search by keyword; title search is essential and ingredient-keyword search is desirable.
- Open a recipe in the same fixed, readable template used throughout the app.
- Add personal photos/videos in suitable places, including cover and relevant cooking steps.
- Display personal cooking knowledge, not a generic public discovery feed.
- Latest-recipe shortcut opens the most recently saved recipe and has an understandable empty state.

### Recommended supporting behaviour

- Manual create/edit as an accessible fallback to conversation.
- Edit and delete recipes, with confirmation for destructive deletion.
- Replace/remove media and show upload progress and recovery.
- Helpful collection context such as servings and supplied prep/cook times.
- Never fabricate a photo, duration, serving count, or media URL as if the user supplied it.

### Proposed recipe content contract

The consistent template is confirmed; exact required fields and media placement remain open.

| Field | Meaning |
| --- | --- |
| ID and owner | Server-managed record identity and account association. |
| Title | Searchable recipe name. |
| Description | Optional short summary. |
| Base servings | Positive serving count required for reliable scaling. |
| Prep/cook times | Optional known durations; unknown values remain unknown. |
| Ingredients | Ordered names, quantities, units, preparation notes, optional flag. |
| Method | Ordered instructions; optional known timings and step media references. |
| Tips/substitutions | Personal notes preserved from the conversation. |
| Tags | Optional searchable labels. |
| Cover/step media | Authorised storage references, separate from recipe text. |
| Created/updated | Server timestamps. |

## 6. AI Assistant

### Confirmed capabilities

- Natural conversational experience resembling a call.
- Discuss a recipe in any order, organise it, revise it, and save only after approval.
- Understand shopping-day inventory descriptions with amounts/units.
- Compare cookbook requirements and serving needs with usable inventory.
- Explain ambiguities and let the person correct the result.
- Open recent saved recipe/list without searching.

### Required interaction safeguards

Text fallback is recommended in the PDF and required by this accessibility design guide.

1. Clearly differentiate user and assistant messages.
2. Ask focused follow-up questions when critical information is missing.
3. Present an explicitly labelled, structured **Draft**.
4. Offer **Edit**, **Continue conversation**, and **Approve & Save**.
5. Save through a validated, owner-authorised backend operation only after explicit approval.
6. Display successful saving only after the backend confirms it.
7. Do not show unapproved drafts in the saved cookbook or approved grocery history.
8. Preserve recoverable input after errors and prevent duplicate approval saves.

### Voice behaviour

- Request microphone permission only after an explicit action and explain why.
- Show recording/listening/processing state and working Stop/mute controls.
- Handle denied permissions, unavailable microphones, connection loss, and interrupted calls.
- Provide readable conversation text where practical; voice must not be the only way to complete a core task.
- Test real phone/browser behaviour and supported languages before claiming support.
- Launch languages, voice personality, latency expectations, and audio/transcript retention remain open.

### AI authority boundary

AI may extract, clarify, propose, and revise structured data. It must not execute generated server code, bypass approval, perform unrestricted writes, or serve as the authoritative calculator.

## 7. Grocery planning and arithmetic

### Planning journey

1. The user states the shopping goal.
2. Establish which recipes and serving counts the list should cover.
3. Capture the current fridge/freezer/cupboard report, including quantities/units.
4. Identify uncertain counts or incompatible measurements and ask/show assumptions.
5. Scale recipe needs and combine genuinely equivalent ingredients.
6. Subtract only comparable, usable on-hand quantities.
7. Show the proposed list and the assumptions behind it.
8. Discuss corrections, then save the dated list only after approval.

**Open:** default to the whole cookbook or selected meals. Both are discussed in the PDF; neither default is final. Do not silently buy ingredients for every stored recipe.

### Deterministic rules

`required = base ingredient quantity × (target servings ÷ base servings)`

`to buy = max(0, combined required quantity − usable on-hand quantity)`

Blueprint example: 300g beef for 2 servings becomes 600g for 4; 200g usable on hand means 400g to buy.

- Convert compatible mass units (`kg`/`g`) and volume units (`L`/`mL`) reliably.
- Never automatically convert counts to weight, cups to mass, or partial packages to exact amounts without an explicit justified basis.
- Tomatoes and tomato paste are not equivalent; pluralisation alone must not merge distinct foods.
- Handle unknown quantities explicitly; don't silently treat unknown as zero or exact.
- Optional ingredients follow user choice, not an undisclosed inclusion/exclusion rule.
- Past inventory can be stale. A new shopping session must not silently overwrite unrelated history.
- Recipe-to-list traceability is recommended.

**Recommended, not settled:** dated inventory snapshots per shopping session. Persistent pantry tracking and purchase-to-inventory reconciliation are separate open enhancements.

## 8. Grocery lists and history

### Confirmed

- Clearly show the latest approved list.
- Browse older lists separately by date.
- Open an organised, touch-friendly list with names, amounts, and units.
- Check and uncheck individual items while shopping.
- Persist check state across reloads for that specific list.
- Keep historical lists separate; checking a current item must not change an older list.
- Latest-list shortcut opens the actual latest saved list and handles no-list state.

### Recommended

- Category grouping, manual additions, and editable items.
- Explicit Ready/Shopping/Completed statuses; Draft remains distinct from approved history.
- Reversible check interactions and clear pending/failed-sync feedback.
- Show progress without implying that checked items were purchased or pantry was updated.

## 9. Account, privacy, and media

- **Confirmed:** authentication protects private **cloud** recipes, lists, conversations, and relevant preferences. Guest use is available without creating an account.
- **Confirmed guest choice:** guests can save recipes and grocery lists **on this device**, in this browser's local storage. Guest create/edit/delete, explicit list approval, quantity calculations, and shopping check-off must persist across reloads.
- Keep the guest kitchen separate from every signed-in cloud account. Signing in must not silently upload/merge guest records; signing out must not erase them. A cloud authentication or network failure must never redirect a signed-in save into guest storage.
- Guest data is not an authenticated cloud backup: anyone using that browser profile may access it, and clearing site/browser data removes it. Surface this distinction concisely in Settings and its privacy disclosure. Report blocked/full/corrupt storage explicitly instead of claiming a successful save.
- **Guest access applies appwide, including AI Assistant.** Guests can chat, review/edit a proposed recipe and explicitly approve it into their device kitchen without signing in. AI requires internet access and sends the submitted conversation and current draft for processing; it does not automatically upload the whole guest cookbook or lists. Guest chats/drafts remain browser-session scoped; approved records persist in device storage.
- Derive account identity from the authenticated server session, never a client-supplied owner ID.
- Authorise every private **cloud kitchen** read/write and media access against that account. The stateless AI proposal endpoint accepts guests without granting access to account storage. Validate requests, reject cross-site browser mutations, disable response caching, and bound AI usage by authenticated account or anonymous IP. Current rate limits are per running server, not a distributed billing quota.
- Keep provider secrets server-side; never bundle secrets into frontend code.
- Validate text, quantities, units, file type/size, and ownership.
- Store media bytes in object storage, separate from structured recipe records.
- Explain what audio, transcripts, images, and recipe data are sent to providers or retained.
- Account recovery/sign out belong in the account experience.
- Cross-device access is a proposed implementation of account persistence and must be honestly described once built.
- Export, account/data deletion, dietary/unit/language settings, notifications, and support/about are recommendations or future scope—not all mandatory first-release features.
- Exact retention/deletion policy, optional sync/privacy controls, and login providers remain open.

### Deferred local-first storage

The user selected **IndexedDB with architect guidance**, then paused implementation to focus on the Settings design. The intended account-scoped local-first architecture, migration safeguards, conflict handling and required **Settings sync tracking** are recorded in [indexeddb_sync_plan.md](indexeddb_sync_plan.md). This is future work, not an enabled capability; do not add simulated sync status or actions to Settings.

### Deferred SQL atomicity and race-condition review

**User request — for later, not implementation now:** review operations and functions currently coordinated in JavaScript that should instead rely on SQL/database guarantees for atomicity and robustness. This records a review requirement, not a finding that every current operation is unsafe.

- Identify database read–modify–write sequences, check-then-insert logic, related multi-record writes, approvals, duplicate prevention, deletions and future sync acknowledgements.
- Move integrity-critical work into atomic SQL statements or correctly scoped PostgreSQL transactions. Apply unique/foreign-key/check constraints, conditional updates, row locks or appropriate isolation where the operation requires them.
- Keep authorization account-scoped throughout the transaction. Couple successful data changes and idempotency receipts so concurrent requests or lost-response retries cannot duplicate or partially apply an operation.
- Use version checks and deliberate conflict handling where concurrent edits must not overwrite one another silently.
- Verify with concurrent requests, retries, interrupted responses and rollback/failure tests; moving code into SQL alone does not establish race safety.
- Keep UI behaviour and suitable pure calculations in JavaScript. Browser-local IndexedDB work needs its own atomic transactions; it is not replaced by PostgreSQL.

Review this alongside the deferred sync architecture before resuming backend/storage implementation. Do not change application code or the database merely to record this note.

## 10. Design specification

Apply [ui_design_skill.md](ui_design_skill.md) as the detailed design implementation guide.

- **Confirmed:** Apple HIG is the primary external reference for Tally's design guidance and all participating implementation skills. The images inform the desired native visual interpretation; NN/G is supporting UX research. MDN/W3C govern semantic HTML and web accessibility, not a competing aesthetic. The user's explicit product, solid-colour, and no–Liquid Glass requirements remain binding.
- Use the guide's researched semantic-element catalogue, Apple HIG component mappings, and shared component contracts for consistency across core screens, authentication, forms, dialogs, loading/error states, and future voice/media flows. HTML tag choice and native visual treatment are separate concerns.
- Destinations use navigation links, actions use buttons, headings follow content hierarchy, and inputs retain labels and appropriate semantics. The five bottom routes are not automatically an ARIA tabs widget.
- Follow relevant implementation skills alongside these project guides; they do not replace the shared visual/interaction rules or authorise weakening auth, privacy, validation, or explicit approval.
- iOS 7+ inspired visual principles with solid, opaque surfaces and navigation; no Liquid Glass, frosted blur, translucent panels, or primary gradients.
- **Confirmed colour roles:** orange primary in light mode; gold replaces orange in dark mode; pink is tertiary; black and white form the secondary foundation.
- Addendum starting shades: orange `#F97316`, gold `#E8B44B`, pink `#F3A6BF`. These are suggestions, not final approved shades or Apple system constants; validate actual contrast pairs.
- iOS uses system typography/SF Pro through the system font stack and accessible scaling. “Jartaka” is provisionally interpreted as Plus Jakarta Sans; confirm the exact Google font family before implementation. Android's precise font mapping remains open.
- Readable hierarchy, generous useful spacing, **Hugeicons** interface icons chosen for iOS-like clarity, and restrained transitions. The user's latest Hugeicons instruction supersedes Iconoir; use one shared outline family, not Apple SF Symbols. See the mapping and sizing/accessibility rules in `ui_design_skill.md`.
- Five visible labelled destinations in the confirmed order, prominent third/centre AI, safe-area padding.
- Large tappable grocery rows and controls; visible focus, accessible names, colour-independent states.
- Support 200% text enlargement, keyboard access, text alternatives to audio, and reduced motion.
- Include empty, loading, no-results, offline, denied-permission, upload, failure/retry, draft, and saved states.
- UI content must accurately reflect storage, recording, and sync state.
- Target recognisable **iOS** composition and controls, not generic mobile styling. Keep routine screen/action labels concise; remove redundant taglines, explanatory subtitles, and helper copy while retaining essential labels, units, validation, privacy, and save/delete/approval context.

### Native sections and content grouping

Follow the **Native screen sections: structure and separation** guidance in `ui_design_skill.md`, researched primarily from Apple HIG Layout, Lists and tables, Scroll views, and Collections, with Apple's developer references for section headers/footers and native list appearances.

- Structure screens around their task: navigation context, coherent scrolling content, meaningful groups/rows, and persistent bottom navigation. A modal sheet is a separate temporary task, not a decorative content section.
- Choose plain/grouped/inset-grouped lists or reading/detail groups according to content. Not every group requires a card, title, border, or footer.
- Separate unrelated groups with deliberate spacing and, where useful, solid surfaces; separate related rows with restrained aligned separators. Section footers explain their own group, not the whole app like a marketing footer.
- Use native-feeling navigation rows, checkable rows, and informational rows distinctly. Preserve readable text, input, scroll position, safe areas, and keyboard access as groups grow.
- Apply the screen-specific mappings in the design guide to Cookbook, recipe details/editing, AI, groceries, and Settings. This is researched design guidance, not a claim that the existing screens have already been restyled to every rule.

### How to use the supplied image references

The images establish a native visual target: screen-level composition rather than webpage sections, strong readable hierarchy, solid grouped surfaces, restrained rounded geometry, deliberate spacing, compact app controls, prominent central interaction, and thoughtful food imagery where appropriate. Apply these qualities to Tally's real screens and supporting flows, not just decorative pictures.

The images cannot demonstrate motion, keyboard behaviour, or touch responsiveness; those must independently satisfy the native interaction requirements. Their calorie tracking, nutritional percentages, scanning, and public/trending recipes are **not** added to Tally's scope. The five-tab addendum and the user's orange/gold/pink, solid-colour, no–Liquid Glass directions override conflicting navigation, colours, gradients, or materials in individual reference images.

## 11. Proposed logical data model

This model describes relationships, not a final database schema:

- **Users:** authentication identity, relevant profile/preferences, creation date.
- **Recipes:** owner, title, summary, servings, known times, timestamps.
- **Recipe ingredients:** ordered ingredient data linked to a recipe.
- **Recipe steps:** ordered method and optional timing.
- **Recipe media:** recipe/step, owner, storage reference, media type, order.
- **Conversations/messages:** owner, turns, language/transcripts as permitted by retention policy.
- **Inventory snapshots/items:** owner, shopping-session date, reported amounts/units and uncertainty.
- **Shopping plans:** recipe selection and target servings, if that workflow is adopted.
- **Grocery lists/items:** owner, date/status, source session, quantities/units, per-item checks.

The model must preserve draft-versus-approved boundaries. Draft persistence and retention should be explicit; saving conversation history is not approval to save a recipe.

## 12. Architecture and reliability recommendations

- Keep the existing JavaScript Vite project; do not replace it with a TypeScript scaffold.
- Route authenticated UI requests through tested server-side recipe/list services.
- Use bounded AI tools for draft/revision/proposal, with separate explicit approval operations.
- Validate structured AI output against an application-owned contract.
- Make repeated approval requests safe from duplicate records.
- Preserve user input on interrupted requests; clearly indicate unsaved changes.
- Handle network/permission/media failures without pretending success.
- Clear account-scoped caches on account changes; do not leak a previous account's data.
- Avoid private-response caching in a shared/public service-worker cache.
- Define offline checklist sync/conflict handling before promising offline editing.
- Add suitable usage limits and operational error reporting.
- Use platform-supported backup/recovery procedures; do not improvise scheduled database dumps.

## 13. Delivery sequence

This is the blueprint's recommended sequence, not a statement that the steps are complete:

1. **Foundation:** JavaScript app, approved design guidance, strictly native-feeling five-tab shell including Home and Settings, nested screens, honest states, authentication and server access control.
2. **Cookbook:** fixed recipe format, manual fallback, search/details, persistence, ownership, media.
3. **Assistant:** structured text conversation, review/revision/approval; then voice and multilingual verification.
4. **Grocery intelligence:** inventory report, explicit shopping scope/servings, deterministic shortages, approved lists/history.
5. **Release readiness:** persistent shopping state, accessibility, real-device checks, error/usage controls, privacy decisions, secure publishing.

The first useful end-to-end milestone remains: **sign in → create/review/approve a recipe → find it in Cookbook → reopen after refresh**.

The requested architect consultation and specification updates preceded implementation. The development build includes the five-tab shell, account-scoped and device-only guest recipe storage, manual recipe editing/search, guest-accessible text AI drafts with explicit approval, deterministic grocery previews/approval, dated lists and persistent item checks, and device theme preferences. Home promotes actual saved recipes/meals and recommends existing recipes using device-local opening counts, with visible empty states rather than fabricated activity.

This is not the full release: voice conversations, recipe photo/video uploads, full offline editing/sync, final typography/branding decisions, and installed real-device acceptance remain outstanding. A passing build or browser test does not by itself satisfy the strict native-feel release gate.

## 14. Core acceptance criteria

- [ ] Tally looks **and feels native** throughout the real-phone journey; a website-like result blocks acceptance.
- [ ] Routine navigation avoids full-document reloads and preserves tab/back state, scroll, and draft input.
- [ ] Touch feedback, scrolling, transitions, keyboard, safe areas, and sheets work coherently without hover dependence or layout jumps.
- [ ] Installed launch is standalone, with no app-created browser chrome or website-style page structure.
- [ ] Register/sign in works, and two accounts cannot read/write each other's records or media.
- [ ] Exactly five labelled bottom destinations, ordered Home, Cookbook, AI Assistant, Groceries, Settings; third/centre AI is most prominent.
- [ ] Home is a native-feeling app screen with personal recipe/meal promotion and most-opened recommendations, visible empty sections, and no fabricated activity.
- [ ] Settings opens from the fifth tab without requiring duplicate header shortcuts.
- [ ] AI retains recent-recipe and recent-list shortcuts; recipe/list/profile/auth screens remain nested.
- [ ] A casual recipe description becomes a readable fixed-format draft.
- [ ] The person can correct/revise the draft and explicitly approve.
- [ ] Unapproved drafts never appear as saved recipes or approved grocery lists.
- [ ] Saved recipes are searchable and reopen after refresh.
- [ ] Personal photo/video upload, placement, replacement/removal, and authorisation work.
- [ ] Inventory quantities and requested servings are captured with visible uncertainty.
- [ ] Grocery calculations scale correctly, merge only equivalent foods, and subtract only comparable units.
- [ ] The person can revise and approve a dated grocery list.
- [ ] Check/uncheck state persists on the correct list after reload.
- [ ] Older lists remain independent and accessible.
- [ ] Recent shortcuts open the actual latest saved records or clear empty states.
- [ ] Solid-colour light/dark design follows orange/gold primary, tertiary pink, and black/white foundation, with tested contrast.
- [ ] Screen sections follow HIG-led grouping and hierarchy, with consistent spacing, local headers/footers where useful, aligned row separators, and no website-style panel sequence or unnecessary nested scrolling.
- [ ] Installable PWA behaviour is verified on supported browsers.
- [ ] The critical journey works on a real phone; microphone denial has a usable text alternative.
- [ ] Product copy distinguishes implemented features, pending work, drafts, and actual saved/synced data.

## 15. Decisions that remain open

- Logo/icon and name availability checks, without reopening the user's selected name Tally.
- Final exact light/dark shades, exact Google font family, and Android font mapping.
- Whether to add any optional Home modules beyond the confirmed personal content and existing kitchen actions.
- Whole-cookbook versus selected-meal default; any weekly planning feature.
- Exact recipe required fields and media placement.
- Launch languages, voice character, interruption/latency expectations.
- Session inventory snapshots versus persistent pantry management.
- Login methods, retention/privacy policy, export and cross-device/offline sync details.
- Categories, favourites, budgeting, store modes, notifications, and purchase reconciliation.

Do not fabricate these decisions. Home and Settings are now confirmed top-level destinations; the previous unspecified-fifth-page question and AI-order/Settings-header conflicts are resolved by the addendum.

## 16. External design references

The source-linked research, historical caveats, proposed palette, calculated contrast pairs, and implementation checklist are in [ui_design_skill.md](ui_design_skill.md).

The guide also includes Apple HIG button/text-field/toolbar/list/alert guidance, MDN semantic HTML references, and W3C WAI patterns for landmarks, actions, tabs, dialogs, and status messages. This is a researched specification, not proof that every existing component already conforms; implementation must be checked against it.

**Primary design source:** [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/).

Component-specific Apple references and supporting UX/accessibility sources:

- [NN/G usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).
- [NN/G mobile navigation](https://www.nngroup.com/articles/mobile-navigation-patterns/).
- [NN/G touch target research](https://www.nngroup.com/articles/touch-target-size/).
- [Apple HIG: Color](https://developer.apple.com/design/human-interface-guidelines/color).
- [Apple HIG: Typography](https://developer.apple.com/design/human-interface-guidelines/typography).
- [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars).
- [Apple archived iOS 7 appearance guidance](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/TransitionGuide/AppearanceCustomization.html).
- [WCAG 2.2 contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

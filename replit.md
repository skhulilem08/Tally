# Tally development

Tally's existing application is in `tally/`. Keep the JavaScript Vite app; do not replace the project scaffold while implementing features.

## Commands

- Install runtime dependencies at the workspace root with `npm ci`, and the Vite toolchain with `npm --prefix tally ci`.
- `npm run dev` starts the API on internal port 3001 and Vite on port 5000. The existing **Tally** workflow runs this application's development command.
- `npm run build` builds the frontend.
- `npm test` runs grocery arithmetic and validation checks.
- `npm --prefix tally run lint` checks JavaScript.
- `npm start` serves the production API and built frontend together, using `PORT`.

The root npm package holds supporting dependencies; `tally/package.json` holds the existing Vite/React toolchain. This is not a pnpm workspace.

## Services

- Development API calls go through Vite's same-origin `/api` proxy.
- PostgreSQL schema setup runs from `tally/server/schema.sql` on API startup. Changes must remain additive and preserve existing records.
- Clerk owns authentication. API ownership is always derived from the authenticated session; never add a browser auth bypass or a client-supplied owner.
- OpenAI credentials stay server-side. AI output is a draft, never approval to save.
- The current build supports text chat and structured recipes/lists. Voice and media uploads remain separate work; do not claim they are implemented.
- Never cache private API responses, authentication responses, or personal records in the public service-worker cache.

Read `tally_specs.md` and `ui_design_skill.md` for the current product and interaction requirements before changing screens.

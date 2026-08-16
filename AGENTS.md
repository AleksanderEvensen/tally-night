# Repository Guidelines

## Project Structure & Module Organization

This repo now targets the website, not the old React Native app. Ignore `rn-app/` unless a task explicitly calls for legacy code.

Application code lives in `src/`. Route files are in `src/routes`, shared UI in `src/components`, reusable hooks in `src/hooks`, and small utilities in `src/lib`. Database schema and helpers live in `src/drizzle`, with generated migrations in `drizzle/`. Static assets belong in `public/`. Deployment and platform config live in `vite.config.ts`, `wrangler.jsonc`, and `drizzle.config.ts`.

## Build, Test, and Development Commands

Use Bun for local work:

- `bun run dev` starts the Vite dev server on port `3000`.
- `bun run build` creates a production build.
- `bun run preview` serves the built app locally.
- `bun run test` runs the Vitest suite once.
- `bun run lint` checks the codebase with `oxlint`.
- `bun run format` checks formatting with `oxfmt`.
- `bun run ai-fix` applies lint fixes and writes formatting changes.
- `bun run deploy` builds and deploys through Wrangler.
- `bun run db:generate` / `db:migrate` / `db:push` manage Drizzle migrations.

## Coding Style & Naming Conventions

Follow `.editorconfig`: 2-space indentation, LF line endings, and a 100-character soft limit. Prefer TypeScript and ESM modules. Use `PascalCase` for React components, `camelCase` for functions and variables, and route filenames that match TanStack Router path conventions such as `src/routes/index.tsx` or `src/routes/about.tsx`.

Run `bun run lint` and `bun run format` before opening a PR. Do not manually edit generated files such as `src/routeTree.gen.ts`.

## Testing Guidelines

Vitest is configured as the test runner. Add tests alongside the code they cover using `*.test.ts` or `*.test.tsx`. Prioritize route behavior, form logic, and database helpers. There is no hard coverage gate yet, but new features should ship with focused tests and bug fixes should include a regression test when practical.

## Commit & Pull Request Guidelines

Recent history uses short, imperative commit subjects, often with Conventional Commit prefixes like `chore:`. Prefer `feat:`, `fix:`, `chore:`, and `refactor:` with a concise scope.

PRs should explain user-visible changes, list any config or schema updates, and include screenshots for UI work. Link the relevant issue when one exists, and call out any required env vars or migration steps.

## Security & Configuration Tips

Secrets belong in `.env.local` or `.env`, never in source control. Local development defaults to `file:local.db`. For remote databases, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` locally and in Cloudflare Worker environment variables or secrets.

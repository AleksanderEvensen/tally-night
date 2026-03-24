# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expo Router (v6) React Native app with NativeWind (Tailwind CSS) styling. Uses a stack navigator with file-based routing. Targets iOS and Android (no web target in platforms).

## Commands

```bash
bun install              # Install dependencies (bun is the package manager)
bun start                # Start Expo dev server
bun run ios              # Start on iOS simulator
bun run android          # Start on Android emulator
bun run lint             # Lint with oxlint
bun run format           # Format with oxfmt
bun run ai-fix           # Auto-fix lint + format (oxlint --fix && oxfmt --write)
bun run prebuild         # Generate native projects
```

## Architecture

- **Routing**: `app/` directory uses Expo Router file-based routing with a `Stack` navigator. `_layout.tsx` is the root layout, each file is a route.
- **Styling**: NativeWind (Tailwind via `className` props on RN components). Styles are typically defined as `const styles = { key: 'tailwind classes' }` objects at the bottom of each file. Global CSS entry point is `global.css`.
- **Components**: Shared UI components live in `components/`. Imported via `@/` path alias (mapped to project root).
- **Path alias**: `@/*` maps to `*` (project root) — configured in `tsconfig.json`.

## Code Style

- **Formatter**: oxfmt — single quotes, trailing commas (`es5`), bracket same line
- **Linter**: oxlint with import, react, and typescript plugins. Correctness category is off. Uses `eslint-plugin-expo` as a JS plugin.
- **TypeScript**: Strict mode enabled
- **Indentation**: 2 spaces, LF line endings

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

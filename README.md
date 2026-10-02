# Bobot

Revived as a personal PC assistant platform.

## Current Product Direction
Bobot is now centered on a local-first assistant experience powered by:
- Next.js + Node dashboard (`apps/dashboard`)
- SQLite persistence via Prisma
- Voice reminders from the dashboard
- GitHub trending shortcuts for fast discovery

Primary plan reference: `docs/plans/14-bobot-personal-assistant-platform.md`.

## Repository Modes

### 1) Active (Revived)
- `apps/dashboard`: active application surface
- This is the default path for new product work.

### 2) Legacy Integrations (Keep As-Is)
- Existing integrations under root folders like `commands/`, `cron/`, `routes/`, `utils/`, and legacy Discord/Firebase code are retained for reference and selective reuse.
- They are not the default runtime for the revived product.
- Reuse or replacement is done case-by-case when a specific integration is needed.

## Quick Start (Revived Dashboard)
From repo root:

```bash
npm install
npm run dashboard:db:generate
npm run dashboard:db:push
npm run dashboard:dev
```

Open: `http://localhost:3010`

## Root Scripts
- `npm start` -> starts revived dashboard dev server
- `npm run dashboard:dev` -> dashboard dev
- `npm run dashboard:build` -> dashboard production build
- `npm run dashboard:start` -> dashboard production server
- `npm run dashboard:db:generate` -> Prisma client generation
- `npm run dashboard:db:push` -> sync schema to SQLite
- `npm run cron` -> legacy cron workflows

## Breaking-Change Upgrades Applied
The revived dashboard was adjusted for latest major versions:
- Next.js 16: explicit Turbopack root config
- Prisma 7: moved datasource URL to `prisma.config.ts`
- Prisma 7 + SQLite: migrated to `@prisma/adapter-libsql` (`@libsql/client`) for maintained SQLite driver wiring

## Deprecated Package Cleanup
- Removed unused direct packages: `jest`, `uws`
- Replaced deprecated `better-sqlite3` chain with `@prisma/adapter-libsql` + `@libsql/client`

Official docs used:
- Next.js v16 upgrade: https://nextjs.org/docs/app/guides/upgrading/version-16
- Next.js turbopack config: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
- Prisma 7 upgrade: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- Prisma config reference: https://docs.prisma.io/docs/v6/orm/reference/prisma-config-reference

## Docs
- Backlog: `docs/backlog.md`
- Plans index: `docs/plans/README.md`
- Finished tasks: `docs/finished-tasks/README.md`

## Notes
- Legacy root runtime was dependency-upgraded but not fully behavior-migrated to modern Discord/Firebase APIs in this pass.
- Treat legacy runtime as preserved integration inventory while dashboard remains the production path.

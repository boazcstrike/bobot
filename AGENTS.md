# AGENTS Instructions

## UI/UX Skill Requirement
- For any UI/UX coding, design, styling, layout, animation, or dashboard visual overhaul task, always use the `ui-ux-pro-max` skill first.
- Start by generating a design system from the skill, then implement code changes aligned with that output.

## Dashboard Component Standard
- For `apps/dashboard`, use `shadcn/ui` components as the default UI building blocks instead of ad-hoc raw HTML controls.
- Keep dashboard theming wired through shared semantic tokens (`--background`, `--foreground`, `--card`, `--primary`, etc.) so color-scheme switching updates all component states consistently.

## Dashboard Design System (ported)
- The dashboard shell and component styling are ported from [shadcndashboard](https://github.com/shadcndashboard/shadcndashboard) (MIT). Match that template when adding UI.
- `components/ui/*.tsx` are the upstream shadcn primitives and carry `cn-*` marker classes. **Do not strip those classes** — `app/styles/style-lyra.css` restyles every component through them, scoped by the `style-lyra` class on `<html>`.
- Shell lives in `components/layout/`: `full-layout.jsx` (sidebar + header + footer frame), `sidebar/` (nav model in `sidebar-items.js`), `header/`, `shared/`.
- Dashboard cards use `components/shared/dashboard-card.jsx` inside a `grid grid-cols-12 gap-px bg-border p-px` band; `components/layout/shared/divider.jsx` separates bands.
- Two independent color controls:
  - **Light/dark** — header toggle, `components/theme-provider.jsx`, writes `.dark` on `<html>`.
  - **Palette** — Settings modal in `app/dashboard-shell.jsx`. Palettes write inline custom properties on `<html>` and override the stylesheet. "Shadcn Neutral" carries no vars and hands control back to light/dark.
- Chart and component colors must reference the semantic tokens (`var(--primary)`, `var(--chart-2)`), **not** the legacy `--color-*` vars, which still drive pre-port page styles.
- Pre-port pages keep their old CSS under the `.legacy-page` scope, registered in `PAGE_CLASS_MAP` in `app/dashboard-shell.jsx`. New pages must not use it.

## Required Context Source
- Before starting strategy, planning, marketing, product, or execution tasks, review the markdown files under `docs/plans/`.
- Treat `docs/plans/README.md` as the entrypoint, then load relevant detailed plan files as needed.
- Keep outputs consistent with the goals, positioning, milestones, and KPIs documented in `docs/plans/`.
- If a request conflicts with `docs/plans/`, call out the conflict and propose an explicit update path.

## Git Workflow Policy

This repository has a single developer. Pull requests are **prohibited** here.

- **Never** open a pull request in this repository. Do not run `gh pr create`, do not draft a PR body, do not push a branch "ready for PR".
- **Never** ask which branch to target or whether to open a PR. There is no review gate.
- Commit completed, verified work directly to `master` and push it.
- Do not create a feature branch unless the user explicitly asks for one. If one already exists, fast-forward `master` onto it and push `master`.
- Every other rule still applies: build/lint/typecheck must pass and browser verification must be done **before** committing. No PR does not mean no verification.
- Commit messages keep the conventional format (`feat:`, `fix:`, `refactor:`, ...) and stay scoped to one logical change.
- This policy overrides the global `git-workflow.md` and `development-workflow.md` PR steps for this repository only.

## Testing Policy
- Testing is **prohibited** unless explicitly specified in user prompt.
- No test runs, test suite execution, or test coverage checks unless user asks for them.
- Focus on code changes and feature implementation only.

## Dashboard Pages (Current)
- **/** - Home page
- **/personal-github-repos** - GitHub repositories viewer
- **/expenses** - Expenses tracking
- **/credit-card-statements** - Credit card statement imports
- **/expense-dashboard** - Expense visualization

## Dashboard User
- Name: Boaz Sze
- Email: boaz@mindyou.com.ph
- Theme: Semantic tokens system (--background, --foreground, --card, --primary, etc.)

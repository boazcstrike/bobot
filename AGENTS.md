# AGENTS Instructions

## UI/UX Skill Requirement
- For any UI/UX coding, design, styling, layout, animation, or dashboard visual overhaul task, always use the `ui-ux-pro-max` skill first.
- Start by generating a design system from the skill, then implement code changes aligned with that output.

## Dashboard Component Standard
- For `apps/dashboard`, use `shadcn/ui` components as the default UI building blocks instead of ad-hoc raw HTML controls.
- Keep dashboard theming wired through shared semantic tokens (`--background`, `--foreground`, `--card`, `--primary`, etc.) so color-scheme switching updates all component states consistently.

## Required Context Source
- Before starting strategy, planning, marketing, product, or execution tasks, review the markdown files under `docs/plans/`.
- Treat `docs/plans/README.md` as the entrypoint, then load relevant detailed plan files as needed.
- Keep outputs consistent with the goals, positioning, milestones, and KPIs documented in `docs/plans/`.
- If a request conflicts with `docs/plans/`, call out the conflict and propose an explicit update path.

## Testing Policy
- Testing is **prohibited** unless explicitly specified in user prompt.
- No test runs, test suite execution, or test coverage checks unless user asks for them.
- Focus on code changes and feature implementation only.

## Dashboard Pages (Current)
- **/** - Home page
- **/laundry** - Laundry tracking & management
- **/personal-github-repos** - GitHub repositories viewer
- **/expenses** - Expenses tracking
- **/credit-card-statements** - Credit card statement imports
- **/expense-dashboard** - Expense visualization

## Dashboard User
- Name: Boaz Sze
- Email: boaz@mindyou.com.ph
- Theme: Semantic tokens system (--background, --foreground, --card, --primary, etc.)

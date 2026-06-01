# Dashboard Navigation Performance Review

**Date:** 2026-05-31
**Scope:** `apps/dashboard` — lag when navigating between routes (`/`, `/laundry`, `/expenses`, `/personal-github-repos`, `/credit-card-statements`).
**Method:** Static review of `app/layout.js`, `app/page.js`, the per-route pages, `app/components/control-rail-shell.jsx`, `components/app-sidebar.jsx`, and `app/globals.css`.

---

## Summary

Navigation feels laggy for four compounding reasons, in rough order of impact:

1. **The whole app shell (sidebar + providers) re-mounts on every route change** — it lives inside each page instead of the layout.
2. **Always-on, GPU-expensive infinite CSS animations** (three 60px-blurred aurora blobs + animated mesh grid) repaint behind every page and must re-rasterize on each navigation.
3. **2-second polling intervals** on two routes fire network requests + full client re-renders forever, competing with navigation.
4. **Every page is a heavy `"use client"` component** that fires 3–4 `cache: "no-store"` fetches on mount and pulls big client bundles (Recharts) with no code-splitting.

None of these is a single "bug"; together they make each navigation re-build a large React tree, re-run data fetches, and repaint costly blurred layers.

---

## Findings

### HIGH-1 — App shell re-mounts on every navigation
**Where:** `app/components/control-rail-shell.jsx`; rendered inside `app/page.js:690`, `app/laundry/page.js:95`, `app/expenses/page.js:208`, and the other route pages. `app/layout.js` only renders `<body>{children}</body>`.

**Problem:** `ControlRailShell` wraps `TooltipProvider` → `SidebarProvider` → `AppSidebar` → `SidebarInset`. Because each *page* renders its own `ControlRailShell`, navigating from `/` to `/laundry` unmounts the entire shell and mounts a fresh one. Every navigation therefore:
- tears down and rebuilds the sidebar, both context providers, and all their children;
- re-reads the sidebar cookie and re-runs `usePathname` wiring;
- re-lays-out the full chrome instead of swapping only the page body.

This is the single biggest contributor to perceived nav lag.

**Fix:** Hoist the shell into the route group layout so only `{children}` changes between routes.
- Create `app/layout` (or a nested `app/(dashboard)/layout.jsx`) that renders `ControlRailShell` once and places `{children}` inside `SidebarInset`.
- Remove the `<ControlRailShell>` wrapper from each page; pages return only their content.
- Move the `pendingStatements` / `onOpenSettings` wiring into the layout (or a small client context) so per-page props still work.
- Keep `layout.js` (root) as the place for `<html>/<body>` + theme boot script.

**Effort:** Medium. **Payoff:** Large — providers + sidebar persist across navigation; route change becomes a body swap.

---

### HIGH-2 — Infinite, blur-heavy background animations always running
**Where:** `app/globals.css` — `.aurora-blob` (`filter: blur(60px)`, `animation: float 18–25s infinite`, three instances 440–600px, `globals.css:98-133`), `.mesh-bg` (`animation: pulseGrid 8s infinite`, `globals.css:822-833`), `body` background = 3 stacked radial gradients (`globals.css:161-170`). Rendered by `control-rail-shell.jsx:47-52` on every page.

**Problem:** Three large radial-gradient circles each blurred at 60px and continuously transform-animated are very expensive to composite — `filter: blur` forces the browser to keep re-rasterizing large layers every frame, forever, on every route. The animated `mesh-bg` adds a second always-on repaint. On navigation these layers mount fresh and must paint immediately, stealing frame budget from the transition. The existing `is-modal-open` pause (`globals.css:138-141`) only helps when a modal is open, not during normal use/navigation.

**Fix (pick per appetite):**
- Cheapest: drop `animation` on `.aurora-blob` and `.mesh-bg` (keep them static) — removes the perpetual repaint while keeping the look.
- Or reduce blur radius (`blur(60px)` → ~`24px`) and shrink blob sizes; cap to a single blob.
- Add `will-change: transform` only while animating, or gate the whole decorative layer behind a "reduced effects" setting.
- The decorative layer is identical per page — once the shell is hoisted (HIGH-1) it stops re-mounting on nav, which compounds this fix.

**Effort:** Low. **Payoff:** Large — removes continuous GPU load and a chunk of per-navigation paint cost.

---

### HIGH-3 — 2-second polling intervals trigger perpetual re-renders
**Where:** `app/page.js:569-577` and `app/laundry/page.js:37-45` — `setInterval(... fetch("/api/laundry/server", { cache: "no-store" }) ..., 2000)`.

**Problem:** Every 2s each page refetches server status and calls `setLaundryServer(...)`, re-rendering a large client component tree. Two routes each run their own interval. This runs regardless of whether the server status is even changing, and the work competes with navigation/interaction for the main thread.

**Fix:**
- Increase the interval (e.g. 5–10s) and/or only poll while the runtime status is transient (`starting`/`stopping`), backing off to slow/no polling when `stopped`/`running`.
- Pause polling when the tab is hidden (`document.visibilitychange`).
- Prefer a single shared poller (a hook/context provided by the hoisted shell) over one per page.
- Longer term: server-sent events / websocket for status instead of polling.

**Effort:** Low–Medium. **Payoff:** Medium–Large — removes a steady stream of re-renders.

---

### MED-1 — Pages are fully client-rendered and fetch on mount
**Where:** all route pages are `"use client"`; `app/page.js:484-533` (`Promise.all` of 4 `no-store` fetches), `app/laundry/page.js:19-35`, `app/expenses/page.js:78-121`.

**Problem:** Each navigation lands on an empty client component that then fires 3–4 uncached fetches before content appears, so the page reads as slow/janky even after the shell swaps. Nothing is server-rendered or cached.

**Fix:**
- Where data isn't user-specific/real-time, move fetching to Server Components or use `fetch` caching / `revalidate` instead of blanket `cache: "no-store"`.
- Add lightweight skeletons so the swap is instant and data fills in.
- Consider `router.prefetch` for the nav links (Next `<Link>` already prefetches in prod; verify it's not disabled).

**Effort:** Medium. **Payoff:** Medium.

---

### MED-2 — Heavy chart bundle loaded eagerly
**Where:** `app/laundry/page.js:9-10` imports `CategoryAverageChart` / `LaundryForecast`, which use `recharts` (declared in `package.json:34`).

**Problem:** Recharts is large; importing it into the client page inflates the bundle that must parse/execute on navigation to `/laundry`.

**Fix:** `next/dynamic` lazy-load the chart components with `{ ssr: false }` and a skeleton fallback so the chart code only loads when that card renders.

**Effort:** Low. **Payoff:** Medium (for `/laundry`).

---

### MED-3 — `backdrop-filter` blur on every `.card`
**Where:** `app/globals.css:843-844` (`.card { backdrop-filter: blur(var(--glass-blur)) }`); glass themes set `--glass-blur: 20px` (e.g. `app/page.js:262`). Plus `.card:hover { transform: translateY(-2px) }` (`globals.css:872-878`).

**Problem:** `backdrop-filter` is one of the most expensive CSS effects; applying it to every card means the browser re-samples the blurred backdrop on scroll, hover-transform, and layout. With many cards per page this adds real paint cost, worst on the glass themes.

**Fix:**
- Default `--glass-blur` to `0px` (already the light default) and only raise it for the few surfaces that truly need glass (e.g. the modal), not every `.card`.
- Drop `backdrop-filter` from `.card` entirely and fake the look with a translucent gradient (already present) — visually close, far cheaper.

**Effort:** Low. **Payoff:** Medium (large on glass themes / long pages).

---

### LOW-1 — Theme apply writes ~40 inline custom properties on mount/change
**Where:** `app/page.js:646-663` (`buildShadcnTokenVars` + `Object.entries(...).forEach(setProperty)` on `documentElement`).

**Problem:** Setting dozens of CSS variables on `:root` invalidates style for the whole tree. Minor on its own, but it runs on the home page mount and every theme switch.

**Fix:** Build one `cssText`/style string and assign once, or only write vars that changed. Low priority.

**Effort:** Low. **Payoff:** Small.

---

### LOW-2 — Render-blocking Google Fonts `@import`
**Where:** `app/globals.css:1` (`@import url("https://fonts.googleapis.com/...")`).

**Problem:** A CSS `@import` for fonts is render-blocking and adds a network round-trip on first paint.

**Fix:** Use `next/font` (self-hosted, preloaded, no layout shift) instead of the CSS `@import`.

**Effort:** Low. **Payoff:** Small–Medium (first load mainly).

---

## Recommended order

1. **HIGH-1** — hoist `ControlRailShell` into a layout (biggest nav win).
2. **HIGH-2** — stop/slim the infinite blur animations.
3. **HIGH-3** — fix the 2s polling (interval, visibility, single shared poller).
4. **MED-3** — drop `backdrop-filter` from `.card`.
5. **MED-2 / MED-1** — lazy-load Recharts; add skeletons / cache fetches.
6. **LOW-1 / LOW-2** — batch theme var writes; move fonts to `next/font`.

Items 1–3 should remove the bulk of the perceived navigation lag. Verify with Chrome DevTools Performance (record a route change before/after) and the React Profiler (confirm the sidebar/providers stop re-mounting).

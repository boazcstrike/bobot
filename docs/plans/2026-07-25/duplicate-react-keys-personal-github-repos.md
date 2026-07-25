# Duplicate React keys on /personal-github-repos

**Priority:** Low
**Status:** Open
**Found:** 2026-07-25, during the shadcndashboard design port (browser QA sweep)

## Issue

`/personal-github-repos` logs a React warning on every load:

```
Encountered two children with the same key, `%s`. Keys should be unique so that
components maintain their identity across updates.
```

Every other route (`/`, `/expenses`, `/expense-dashboard`, `/credit-card-statements`)
is console-clean.

## Context

Pre-existing. The page was not modified by the design port — it renders inside the
new shell but its own markup is untouched. The warning reproduces against the
current `master` implementation of `app/personal-github-repos/page.js`.

Candidate sources, all list renders in that file:

- `app/personal-github-repos/page.js:673` — `<option key={category.id}>` inside the
  `repo-category-options` datalist
- `app/personal-github-repos/page.js:684` — `key={String(repo.id || repo.html_url)}`
  for trending repo rows
- `app/personal-github-repos/page.js:739` and `:822` — `key={category.id}`

`category.id` is the most likely culprit: if two categories share an id (or the id
is undefined) the key collapses to the same value.

## Impact

Cosmetic in normal use. React may reuse or drop the wrong DOM node when the list
reorders, which can surface as a stale category input value after adding or
removing a category. No data loss.

## Recommendation

1. Log `categoryOptions` and confirm whether `category.id` is unique and defined.
2. If ids are not guaranteed, key on a stable composite (`${category.id}-${index}`
   is a fallback; prefer `category.title` if titles are unique).
3. Verify the console is clean on load and after adding/removing a category.

## Suggested acceptance criteria

- `/personal-github-repos` loads with zero React console warnings.
- Adding and removing a category keeps each row's category input bound to the
  correct repository.

## Relevant files

- `apps/dashboard/app/personal-github-repos/page.js`

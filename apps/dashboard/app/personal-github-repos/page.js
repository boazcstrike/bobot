"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ExternalLink,
  FileDiff,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  GitPullRequestArrow,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  WandSparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function StatusList({ title, list, tone }) {
  if (!list || !list.total) return null;
  return (
    <div className="personal-github-status-group">
      <span className="personal-github-status-title">
        {title} <Badge variant={tone}>{list.total}</Badge>
      </span>
      <ul className="personal-github-status-files">
        {list.items.map((entry, index) => {
          const file = typeof entry === "string" ? entry : entry.file;
          const code = typeof entry === "string" ? "" : entry.status;
          return (
            <li key={`${file}-${index}`}>
              {code ? <span className="personal-github-status-code">{code}</span> : null}
              <span>{file}</span>
            </li>
          );
        })}
        {list.truncated ? <li className="muted">… {list.truncated} more</li> : null}
      </ul>
    </div>
  );
}

const TREND_WINDOWS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

function getRepoName(repo) {
  return (repo.full_name || repo.name || "").split("/").pop() || repo.full_name || repo.name || "repository";
}

function normalizeUrl(url) {
  return String(url || "").replace(/\/$/, "").toLowerCase();
}

function cloneCategories(categories) {
  return categories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item })),
  }));
}

function buildMarkdownItem(repo) {
  return {
    id: `staged-${repo.id || repo.html_url || repo.full_name}-${Date.now()}`,
    name: getRepoName(repo),
    url: repo.html_url,
    description: repo.description || "",
  };
}

function suggestCategory(categories, repo) {
  const haystack = `${repo.full_name || ""} ${repo.description || ""}`.toLowerCase();
  const rules = [
    { terms: ["agent", "llm", "ai", "claude", "codex", "gpt"], names: ["Automation & Agents", "AI"] },
    { terms: ["dashboard", "admin", "crm", "analytics"], names: ["Dashboards"] },
    { terms: ["security", "osint", "scanner", "secret", "pentest"], names: ["Security"] },
    { terms: ["readme", "profile"], names: ["GitHub & Profile"] },
    { terms: ["awesome", "curated", "list"], names: ["Curated Lists & Awesome Repositories"] },
    { terms: ["course", "learn", "book", "interview"], names: ["Learning & Skill Improvement"] },
    { terms: ["crawler", "scrape", "data"], names: ["Crawlers", "Web & Data"] },
    { terms: ["tool", "cli", "terminal"], names: ["Dev Tools", "Mini Tools"] },
  ];

  for (const rule of rules) {
    if (!rule.terms.some((term) => haystack.includes(term))) continue;
    const match = categories.find((category) =>
      rule.names.some((name) => category.title.toLowerCase().includes(name.toLowerCase())),
    );
    if (match) return match.title;
  }

  return categories.find((category) => category.title === "General")?.title || categories[0]?.title || "";
}

function resolveCategoryId(categories, value, fallbackId = "") {
  const normalized = String(value || "").trim().toLowerCase();
  const match = categories.find((category) => category.title.toLowerCase() === normalized);
  return match?.id || fallbackId || categories[0]?.id || "";
}

function getRepoCount(categories) {
  return categories.reduce((total, category) => total + category.items.length, 0);
}

export default function PersonalGithubReposPage() {
  const [target, setTarget] = useState(null);
  const [sha, setSha] = useState("");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [categories, setCategories] = useState([]);
  const [initialCategories, setInitialCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [trendingSnapshot, setTrendingSnapshot] = useState({ daily: [], weekly: [], monthly: [] });
  const [activeTrendWindow, setActiveTrendWindow] = useState("weekly");
  const [categoryInputs, setCategoryInputs] = useState({});
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [addingRepo, setAddingRepo] = useState(false);
  const [activity, setActivity] = useState(null);
  const [localPathInput, setLocalPathInput] = useState("");
  const [savingPath, setSavingPath] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ id: category.id, title: category.title, level: category.level })),
    [categories],
  );

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) || categories[0] || null;
  const trackedUrls = useMemo(
    () => new Set(categories.flatMap((category) => category.items.map((item) => normalizeUrl(item.url)))),
    [categories],
  );
  const trendingRepos = trendingSnapshot[activeTrendWindow] || [];
  const dirty = JSON.stringify(categories) !== JSON.stringify(initialCategories);
  const repoCount = getRepoCount(categories);

  async function loadData() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [notesRes, trendingRes] = await Promise.all([
        fetch("/api/personal-github-repos", { cache: "no-store" }),
        fetch("/api/trending", { cache: "no-store" }),
      ]);

      const notesPayload = await notesRes.json().catch(() => null);
      if (!notesRes.ok) {
        throw new Error(notesPayload?.error || "Failed to load github-repos.md.");
      }

      const nextCategories = cloneCategories(notesPayload.categories || []);
      setTarget(notesPayload.target || null);
      setSha(notesPayload.sha || "");
      setRemoteUrl(notesPayload.htmlUrl || "");
      setActivity(notesPayload.activity || null);
      setLocalPathInput(notesPayload.target?.configuredLocalPath || "");
      setCategories(nextCategories);
      setInitialCategories(cloneCategories(nextCategories));
      setSelectedCategoryId((current) => current || nextCategories[0]?.id || "");

      const trendingPayload = await trendingRes.json().catch(() => null);
      if (trendingRes.ok && trendingPayload) {
        setTrendingSnapshot({
          daily: Array.isArray(trendingPayload.daily) ? trendingPayload.daily : [],
          weekly: Array.isArray(trendingPayload.weekly) ? trendingPayload.weekly : [],
          monthly: Array.isArray(trendingPayload.monthly) ? trendingPayload.monthly : [],
          source: trendingPayload.source,
          snapshotDate: trendingPayload.snapshotDate,
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load GitHub repo notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!categories.length || !trendingRepos.length) return;

    setCategoryInputs((current) => {
      const next = { ...current };
      trendingRepos.forEach((repo) => {
        const key = String(repo.id || repo.html_url);
        if (!next[key]) {
          next[key] = suggestCategory(categories, repo);
        }
      });
      return next;
    });
  }, [categories, trendingRepos]);

  function selectCategory(categoryId) {
    setSelectedCategoryId(categoryId);

    const title = categories.find((category) => category.id === categoryId)?.title;
    if (!title) return;

    // Untracked trending repos follow the selected category.
    setCategoryInputs((current) => {
      const next = { ...current };
      trendingRepos.forEach((repo) => {
        if (trackedUrls.has(normalizeUrl(repo.html_url))) return;
        next[String(repo.id || repo.html_url)] = title;
      });
      return next;
    });
  }

  async function addRepoByUrl(event) {
    event.preventDefault();
    const url = newRepoUrl.trim();
    if (!url || !selectedCategory || addingRepo) return;

    setAddingRepo(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/personal-github-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch-repo", url }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to fetch repository details.");
      }

      const repo = payload.repo;
      if (trackedUrls.has(normalizeUrl(repo.html_url))) {
        setMessage(`${repo.full_name} is already in github-repos.md.`);
        return;
      }

      updateCategoryItems(selectedCategory.id, (items) => [buildMarkdownItem(repo), ...items]);
      setNewRepoUrl("");
      setAddFormOpen(false);
      setMessage(`Staged ${repo.full_name} at the top of ${selectedCategory.title}. Commit to write github-repos.md.`);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Failed to add repository.");
    } finally {
      setAddingRepo(false);
    }
  }

  function updateCategoryItems(categoryId, updater) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? { ...category, items: updater(category.items) }
          : category,
      ),
    );
  }

  function addRepo(repo) {
    const repoUrl = normalizeUrl(repo.html_url);
    if (trackedUrls.has(repoUrl)) {
      setMessage(`${repo.full_name} is already in github-repos.md.`);
      return;
    }

    const key = String(repo.id || repo.html_url);
    const categoryId = resolveCategoryId(categories, categoryInputs[key], selectedCategoryId);
    updateCategoryItems(categoryId, (items) => [...items, buildMarkdownItem(repo)]);
    setSelectedCategoryId(categoryId);
    setMessage(`Staged ${repo.full_name} for ${categories.find((category) => category.id === categoryId)?.title || "selected category"}.`);
  }

  function removeRepo(categoryId, itemId) {
    updateCategoryItems(categoryId, (items) => items.filter((item) => item.id !== itemId));
  }

  function moveRepo(categoryId, itemId, direction) {
    updateCategoryItems(categoryId, (items) => {
      const index = items.findIndex((item) => item.id === itemId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;

      const next = [...items];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  async function commit(nextCategories = categories, commitMessage = "chore: update github repo notes") {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/personal-github-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          sha,
          message: commitMessage,
          categories: nextCategories,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to commit github-repos.md.");
      }

      const committedCategories = cloneCategories(payload.categories || nextCategories);
      const committedLocally = payload.target?.mode === "local";
      setSha(payload.sha || sha);
      setRemoteUrl(payload.htmlUrl || remoteUrl);
      setCategories(committedCategories);
      setInitialCategories(cloneCategories(committedCategories));
      setTarget(payload.target || target);
      setActivity(payload.activity ?? activity);
      setMessage(
        payload.committed
          ? `Committed ${payload.commitSha || "latest changes"} ${committedLocally ? "locally" : "through GitHub API"}.`
          : payload.message,
      );
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : "Failed to commit github-repos.md.");
    } finally {
      setBusy(false);
    }
  }

  async function pullLocalRepo() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/personal-github-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pull" }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to pull local notes repo.");
      }

      const pulledCategories = cloneCategories(payload.categories || []);
      setTarget(payload.target || target);
      setSha(payload.sha || sha);
      setRemoteUrl(payload.htmlUrl || remoteUrl);
      setActivity(payload.activity ?? activity);
      setCategories(pulledCategories);
      setInitialCategories(cloneCategories(pulledCategories));
      setSelectedCategoryId((current) => current || pulledCategories[0]?.id || "");
      setMessage(payload.pullOutput || "Local notes repo is already up to date.");
    } catch (pullError) {
      setError(pullError instanceof Error ? pullError.message : "Failed to pull local notes repo.");
    } finally {
      setBusy(false);
    }
  }

  async function saveLocalPath(event) {
    event.preventDefault();
    if (savingPath) return;

    setSavingPath(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/personal-github-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-local-path", path: localPathInput.trim() }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || "Failed to update local checkout path.");

      const nextCategories = cloneCategories(payload.categories || []);
      setTarget(payload.target || target);
      setSha(payload.sha || sha);
      setRemoteUrl(payload.htmlUrl || remoteUrl);
      setActivity(payload.activity || null);
      setLocalPathInput(payload.target?.configuredLocalPath || "");
      setCategories(nextCategories);
      setInitialCategories(cloneCategories(nextCategories));
      setSelectedCategoryId((current) => current || nextCategories[0]?.id || "");
      setMessage(
        payload.target?.mode === "local"
          ? "Local checkout path saved. Git activity loaded."
          : "Path saved, but github-repos.md was not found there — using the GitHub API fallback.",
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update local checkout path.");
    } finally {
      setSavingPath(false);
    }
  }

  async function autoAddAndCommit() {
    const candidates = trendingRepos.filter((repo) => !trackedUrls.has(normalizeUrl(repo.html_url))).slice(0, 5);
    if (!candidates.length) {
      setMessage("No new visible trending repositories to add.");
      return;
    }

    const nextCategories = cloneCategories(categories);
    candidates.forEach((repo) => {
      const key = String(repo.id || repo.html_url);
      const categoryId = resolveCategoryId(nextCategories, categoryInputs[key] || suggestCategory(nextCategories, repo));
      const category = nextCategories.find((item) => item.id === categoryId);
      if (category) {
        category.items.push(buildMarkdownItem(repo));
      }
    });

    setCategories(nextCategories);
    await commit(nextCategories, `chore: add ${activeTrendWindow} trending repos`);
  }

  return (
    <>
      <section className="hero card fade-up personal-github-hero">
        <div className="section-header">
          <p className="eyebrow">Personal GitHub Repos</p>
          <h1>Curate trending repositories into your notes repo</h1>
          <p>
            Stage discoveries from the trending feed, place them into the right markdown category,
            reorder or remove items, then commit first in the local notes checkout.
          </p>
        </div>
        <div className="personal-github-hero-actions">
          <Button type="button" variant="outline" onClick={loadData} disabled={loading || busy}>
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
          <Button type="button" variant="outline" onClick={pullLocalRepo} disabled={loading || busy || dirty || target?.mode !== "local"}>
            <GitPullRequestArrow data-icon="inline-start" />
            Pull local repo
          </Button>
          <Button type="button" onClick={() => commit()} disabled={!dirty || busy || loading}>
            {busy ? <LoaderCircle data-icon="inline-start" className="spin" /> : <GitBranch data-icon="inline-start" />}
            Commit locally
          </Button>
          <Button type="button" variant="secondary" onClick={autoAddAndCommit} disabled={busy || loading || !trendingRepos.length}>
            <WandSparkles data-icon="inline-start" />
            Auto-add top 5 and commit locally
          </Button>
        </div>
        <div className="personal-github-stats">
          <span>
            Target <strong>{target?.repository || "not loaded"}</strong>
          </span>
          <span>
            Mode <strong>{target?.mode === "local" ? "Local git commit" : "GitHub API"}</strong>
          </span>
          <span>
            Checkout <strong>{target?.localPath || "remote fallback"}</strong>
          </span>
          <span>
            File <strong>{target?.path || "github-repos.md"}</strong>
          </span>
          <span>
            Categories <strong>{categories.length}</strong>
          </span>
          <span>
            Repos <strong>{repoCount}</strong>
          </span>
        </div>
        {remoteUrl ? (
          <a className="personal-github-remote-link interactive focus-ring" href={remoteUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="icon-inline" aria-hidden="true" />
            Open remote markdown
          </a>
        ) : null}
      </section>

      {error ? <p className="error personal-github-message">{error}</p> : null}
      {message ? <p className="muted personal-github-message">{message}</p> : null}

      <Card className="personal-github-checkout fade-up delay-1">
        <CardHeader>
          <div>
            <CardTitle className="personal-github-checkout-title">
              <FolderGit2 className="icon-inline" aria-hidden="true" />
              Local checkout
            </CardTitle>
            <CardDescription>
              Point this at a local clone of your notes repo to commit directly and view git activity.
              Saved to disk; falls back to the GITHUB_NOTES_LOCAL_REPO env var.
            </CardDescription>
          </div>
          {target?.localPathSource ? (
            <CardAction>
              <Badge variant={target.mode === "local" ? "secondary" : "outline"}>
                {target.mode === "local"
                  ? `local · ${target.localPathSource}`
                  : "GitHub API fallback"}
              </Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="personal-github-checkout-body">
          <form className="personal-github-path-form" onSubmit={saveLocalPath}>
            <label className="personal-github-add-field personal-github-path-field">
              <span>Local repository path</span>
              <Input
                value={localPathInput}
                onChange={(event) => setLocalPathInput(event.target.value)}
                placeholder="C:/Users/you/webdev/your-notes-repo"
                disabled={savingPath || busy}
              />
            </label>
            <Button type="submit" size="sm" disabled={savingPath || busy}>
              {savingPath ? <LoaderCircle data-icon="inline-start" className="spin" /> : <Save data-icon="inline-start" />}
              Save path
            </Button>
          </form>

          {activity ? (
            <div className="personal-github-activity">
              <div className="personal-github-branch-row">
                <Badge variant="outline">
                  <GitBranch className="icon-inline" aria-hidden="true" />
                  {activity.branch || "detached"}
                </Badge>
                {activity.upstream ? (
                  <Badge variant={!activity.ahead && !activity.behind ? "secondary" : "default"}>
                    {!activity.ahead && !activity.behind
                      ? "in sync"
                      : `↑${activity.ahead} ↓${activity.behind}`}
                  </Badge>
                ) : (
                  <Badge variant="outline">no upstream</Badge>
                )}
                <Badge variant={activity.status?.clean ? "secondary" : "default"}>
                  {activity.status?.clean ? "clean" : "working changes"}
                </Badge>
              </div>

              <div className="personal-github-activity-section">
                <h3 className="personal-github-activity-title">Working changes</h3>
                {activity.status?.clean ? (
                  <p className="muted">No uncommitted changes.</p>
                ) : (
                  <div className="personal-github-status">
                    <StatusList title="Staged" list={activity.status?.staged} tone="default" />
                    <StatusList title="Unstaged" list={activity.status?.unstaged} tone="secondary" />
                    <StatusList title="Untracked" list={activity.status?.untracked} tone="outline" />
                  </div>
                )}
              </div>

              <div className="personal-github-activity-section">
                <h3 className="personal-github-activity-title">
                  <GitCommitHorizontal className="icon-inline" aria-hidden="true" />
                  Recent commits
                </h3>
                {activity.commits?.length ? (
                  <ul className="personal-github-commits">
                    {activity.commits.map((commit) => (
                      <li key={commit.hash}>
                        <code className="personal-github-hash">{commit.shortHash}</code>
                        <div className="personal-github-commit-copy">
                          <span className="personal-github-commit-subject">{commit.subject}</span>
                          <span className="muted">
                            {commit.author} · {formatDate(commit.date)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No commits found.</p>
                )}
              </div>

              {activity.latestDiff?.patch ? (
                <Collapsible className="personal-github-activity-section">
                  <CollapsibleTrigger className="personal-github-diff-trigger focus-ring">
                    <FileDiff className="icon-inline" aria-hidden="true" />
                    Latest commit diff
                    {activity.latestDiff.truncated ? <Badge variant="outline">truncated</Badge> : null}
                    <ChevronDown className="personal-github-diff-chevron" aria-hidden="true" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ScrollArea className="personal-github-diff-scroll">
                      <pre className="personal-github-diff">{activity.latestDiff.patch}</pre>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </div>
          ) : (
            <p className="muted">
              {target?.mode === "local"
                ? "No git activity available for this checkout."
                : "Set a valid local checkout path above to load git activity."}
            </p>
          )}
        </CardContent>
      </Card>

      <section className="personal-github-workbench fade-up delay-2">
        <Card className="personal-github-panel">
          <CardHeader>
            <div>
              <CardTitle>Trending intake</CardTitle>
              <CardDescription>
                Pick a category per repository before staging it into github-repos.md.
              </CardDescription>
            </div>
            <CardAction>
              <Badge variant={dirty ? "default" : "outline"}>{dirty ? "Unsaved" : "Synced"}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="personal-github-panel-body">
            <Tabs value={activeTrendWindow} onValueChange={setActiveTrendWindow}>
              <TabsList>
                {TREND_WINDOWS.map((window) => (
                  <TabsTrigger key={window.id} value={window.id}>
                    {window.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p className="muted personal-github-source">
              Source: {trendingSnapshot.source || "unknown"}
              {trendingSnapshot.snapshotDate ? ` | Snapshot: ${trendingSnapshot.snapshotDate}` : ""}
            </p>
            <datalist id="repo-category-options">
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.title} />
              ))}
            </datalist>
            <ScrollArea className="personal-github-scroll">
              <div className="personal-github-repo-list">
                {loading ? <p className="muted">Loading repositories...</p> : null}
                {!loading && !trendingRepos.length ? <p className="muted">No trending repositories loaded.</p> : null}
                {trendingRepos.map((repo, index) => {
                  const key = String(repo.id || repo.html_url);
                  const alreadyTracked = trackedUrls.has(normalizeUrl(repo.html_url));
                  return (
                    <article key={key} className="personal-github-repo-row">
                      <div className="personal-github-rank">
                        <GitFork aria-hidden="true" />
                        <span>#{index + 1}</span>
                      </div>
                      <div className="personal-github-repo-copy">
                        <a href={repo.html_url} target="_blank" rel="noreferrer" className="interactive focus-ring">
                          {repo.full_name}
                        </a>
                        <p>{repo.description || "No description provided."}</p>
                        <span>{Number(repo.stargazers_count || 0).toLocaleString()} stars</span>
                      </div>
                      <div className="personal-github-row-actions">
                        <Input
                          list="repo-category-options"
                          value={categoryInputs[key] || ""}
                          onChange={(event) =>
                            setCategoryInputs((current) => ({ ...current, [key]: event.target.value }))
                          }
                          aria-label={`Category for ${repo.full_name}`}
                        />
                        <Button type="button" size="sm" onClick={() => addRepo(repo)} disabled={alreadyTracked || busy}>
                          <Plus data-icon="inline-start" />
                          {alreadyTracked ? "Added" : "Add"}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="personal-github-panel">
          <CardHeader>
            <div>
              <CardTitle>Markdown list</CardTitle>
              <CardDescription>
                Select a category, then reorder or remove staged and existing entries.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="personal-github-panel-body">
            <div
              className="personal-github-category-tree"
              role="listbox"
              aria-label="GitHub repo categories and subcategories"
              aria-orientation="vertical"
            >
              {categories.map((category) => {
                const isSelected = selectedCategory?.id === category.id;
                const depth = Math.max(0, (category.level || 2) - 2);
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    data-sub={depth > 0}
                    className="personal-github-category-node focus-ring"
                    style={{ "--node-depth": depth }}
                    onClick={() => selectCategory(category.id)}
                  >
                    <span className="personal-github-category-bullet" aria-hidden="true">
                      {isSelected ? <Check /> : null}
                    </span>
                    <span className="personal-github-category-name">{category.title}</span>
                    <span className="personal-github-category-count">{category.items.length}</span>
                  </button>
                );
              })}
            </div>
            <div className="personal-github-add-bar">
              <Button
                type="button"
                variant={addFormOpen ? "secondary" : "outline"}
                size="sm"
                onClick={() => setAddFormOpen((open) => !open)}
                disabled={!selectedCategory || busy}
                aria-expanded={addFormOpen}
              >
                <Plus data-icon="inline-start" />
                Add repository
              </Button>
              {selectedCategory ? (
                <span className="personal-github-add-hint">
                  into <strong>{selectedCategory.title}</strong>
                </span>
              ) : null}
            </div>
            {addFormOpen ? (
              <form className="personal-github-add-form fade-up" onSubmit={addRepoByUrl}>
                <label className="personal-github-add-field">
                  <span>Repository URL</span>
                  <Input
                    value={newRepoUrl}
                    onChange={(event) => setNewRepoUrl(event.target.value)}
                    placeholder="https://github.com/owner/repo"
                    autoFocus
                    disabled={addingRepo}
                  />
                </label>
                <p className="personal-github-add-note">
                  Name and description are fetched from GitHub on save.
                </p>
                <div className="personal-github-add-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAddFormOpen(false);
                      setNewRepoUrl("");
                    }}
                    disabled={addingRepo}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={addingRepo || !newRepoUrl.trim()}>
                    {addingRepo ? (
                      <LoaderCircle data-icon="inline-start" className="spin" />
                    ) : (
                      <Check data-icon="inline-start" />
                    )}
                    Save
                  </Button>
                </div>
              </form>
            ) : null}
            <ScrollArea className="personal-github-scroll">
              <div className="personal-github-curated-list">
                {!selectedCategory ? <p className="muted">No category selected.</p> : null}
                {selectedCategory?.items.map((item, index) => {
                  const isStaged = String(item.id).startsWith("staged-");
                  return (
                  <article
                    key={item.id}
                    className="personal-github-curated-row"
                    data-staged={isStaged}
                  >
                    <div>
                      <div className="personal-github-curated-name">
                        <a href={item.url} target="_blank" rel="noreferrer" className="interactive focus-ring">
                          {item.name}
                        </a>
                        {isStaged ? <Badge variant="secondary">New</Badge> : null}
                      </div>
                      <p>{item.description || "No description provided."}</p>
                    </div>
                    <div className="personal-github-curated-actions">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveRepo(selectedCategory.id, item.id, -1)}
                        disabled={index === 0 || busy}
                        aria-label={`Move ${item.name} up`}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveRepo(selectedCategory.id, item.id, 1)}
                        disabled={index === selectedCategory.items.length - 1 || busy}
                        aria-label={`Move ${item.name} down`}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => removeRepo(selectedCategory.id, item.id)}
                        disabled={busy}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </article>
                  );
                })}
                {selectedCategory && !selectedCategory.items.length ? (
                  <p className="muted">This category is empty.</p>
                ) : null}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

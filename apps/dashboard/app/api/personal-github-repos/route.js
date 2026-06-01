import {
  fetchGithubRepoMetadata,
  fetchPersonalGithubMarkdown,
  flattenRepoItems,
  getNotesRepoActivity,
  parseGithubReposMarkdown,
  pullPersonalGithubRepo,
  renderGithubReposMarkdown,
  setNotesRepoLocalPath,
  suggestCategoryId,
  updatePersonalGithubMarkdown,
} from "@/lib/personalGithubRepos";

export const runtime = "nodejs";

function buildPayload(file, activity = null) {
  const categories = parseGithubReposMarkdown(file.content);
  return {
    target: file.target,
    sha: file.sha,
    htmlUrl: file.htmlUrl,
    activity,
    categories,
    repos: flattenRepoItems(categories),
    categorySuggestions: categories.map((category) => ({
      id: category.id,
      title: category.title,
      level: category.level,
    })),
  };
}

export async function GET() {
  try {
    const file = await fetchPersonalGithubMarkdown();
    const activity = await getNotesRepoActivity().catch(() => null);
    return Response.json(buildPayload(file, activity));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "failed to load personal GitHub repos" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const action = payload?.action || "commit";

  try {
    if (action === "fetch-repo") {
      const repo = await fetchGithubRepoMetadata(payload?.url);
      return Response.json({ repo });
    }

    if (action === "set-local-path") {
      await setNotesRepoLocalPath(payload?.path);
      const updatedFile = await fetchPersonalGithubMarkdown();
      const updatedActivity = await getNotesRepoActivity().catch(() => null);
      return Response.json({
        ...buildPayload(updatedFile, updatedActivity),
        localPathUpdated: true,
      });
    }

    if (action === "pull") {
      const result = await pullPersonalGithubRepo();
      const pulledFile = await fetchPersonalGithubMarkdown();
      const pulledActivity = await getNotesRepoActivity().catch(() => null);

      return Response.json({
        ...buildPayload(pulledFile, pulledActivity),
        pulled: true,
        pullOutput: result.output,
      });
    }

    const file = await fetchPersonalGithubMarkdown();
    const categories = parseGithubReposMarkdown(file.content);

    if (action === "suggest-category") {
      return Response.json({
        categoryId: suggestCategoryId(categories, payload?.repo || {}),
      });
    }

    if (action !== "commit") {
      return Response.json({ error: "unsupported action" }, { status: 400 });
    }

    if (!payload.sha || payload.sha !== file.sha) {
      return Response.json(
        {
          error: `${file.target.mode === "local" ? "Local" : "Remote"} github-repos.md changed. Reload before committing.`,
          currentSha: file.sha,
        },
        { status: 409 },
      );
    }

    const nextContent = renderGithubReposMarkdown(file.content, payload.categories || []);
    if (nextContent === file.content) {
      return Response.json({
        ...buildPayload(file),
        committed: false,
        message: "No markdown changes to commit.",
      });
    }

    const result = await updatePersonalGithubMarkdown({
      content: nextContent,
      sha: file.sha,
      message: payload.message,
    });
    const committedActivity = await getNotesRepoActivity().catch(() => null);

    return Response.json({
      ...buildPayload(
        {
          ...file,
          sha: result.contentSha || file.sha,
          content: nextContent,
          htmlUrl: result.htmlUrl || file.htmlUrl,
        },
        committedActivity,
      ),
      committed: true,
      commitSha: result.commitSha,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "failed to commit personal GitHub repos" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const date = lastWeek.toISOString().slice(0, 10);
  const url = `https://api.github.com/search/repositories?q=created:>${date}&sort=stars&order=desc&per_page=10`;

  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store",
  });

  if (!res.ok) {
    return new Response("failed to fetch trending repositories", { status: 502 });
  }

  const data = await res.json();
  const repos = (data.items || []).map((repo) => ({
    id: repo.id,
    full_name: repo.full_name,
    html_url: repo.html_url,
    stargazers_count: repo.stargazers_count,
    description: repo.description || "",
  }));

  return Response.json(repos);
}

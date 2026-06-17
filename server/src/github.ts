export interface RawRepo {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  pushed_at: string;
}

export interface RepoCard {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  pushedAt: string;
}

export interface GitHubSummary {
  login: string;
  available: boolean;
  publicRepos: number;
  totalStars: number;
  languages: { name: string; count: number }[];
  recent: RepoCard[];
}

export function summarizeRepos(login: string, repos: RawRepo[]): GitHubSummary {
  const own = repos.filter((r) => !r.fork);
  const langCounts = new Map<string, number>();
  for (const r of own) {
    if (r.language) langCounts.set(r.language, (langCounts.get(r.language) ?? 0) + 1);
  }
  const languages = [...langCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const recent = [...own]
    .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
    }));
  return {
    login,
    available: true,
    publicRepos: own.length,
    totalStars: own.reduce((s, r) => s + r.stargazers_count, 0),
    languages,
    recent,
  };
}

interface SummaryOpts {
  login: string;
  token?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  ttlMs?: number;
}

let cache: { at: number; data: GitHubSummary } | null = null;

const EMPTY = (login: string): GitHubSummary => ({
  login,
  available: false,
  publicRepos: 0,
  totalStars: 0,
  languages: [],
  recent: [],
});

export async function getGitHubSummary(opts: SummaryOpts): Promise<GitHubSummary> {
  const now = opts.now ?? Date.now;
  const ttl = opts.ttlMs ?? 60 * 60 * 1000;
  const doFetch = opts.fetchImpl ?? fetch;

  if (cache && now() - cache.at < ttl) return cache.data;

  try {
    const headers: Record<string, string> = {
      "User-Agent": "projects-portal",
      Accept: "application/vnd.github+json",
    };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    const res = await doFetch(
      `https://api.github.com/users/${opts.login}/repos?per_page=100&sort=pushed`,
      { headers },
    );
    if (!(res as Response).ok) throw new Error(`github ${(res as Response).status}`);
    const repos = (await (res as Response).json()) as RawRepo[];
    const data = summarizeRepos(opts.login, repos);
    cache = { at: now(), data };
    return data;
  } catch {
    if (cache) return cache.data; // serve stale on failure
    return EMPTY(opts.login);
  }
}

/** Test-only: reset the module cache. */
export function __resetGitHubCache() {
  cache = null;
}

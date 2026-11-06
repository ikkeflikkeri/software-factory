/**
 * Fetch repository stats from the unauthenticated GitHub REST API.
 *
 * Results are cached in sessionStorage with a short TTL so that repeat
 * visits stay well within the unauthenticated rate limits.
 */

export type RepoStats = {
  mergedPullRequests: number
  closedIssues: number
  contributors: number
  lastPushAt: string
}

const REPO = "ikkeflikkeri/software-factory"
const CACHE_KEY = "repo-stats"
const CACHE_TTL_MS = 5 * 60 * 1000

type CacheEntry = {
  stats: RepoStats
  fetchedAt: number
}

function readCache(): RepoStats | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null
    return entry.stats
  } catch {
    return null
  }
}

function writeCache(stats: RepoStats) {
  try {
    const entry: CacheEntry = { stats, fetchedAt: Date.now() }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Storage may be unavailable (private mode); caching is best-effort.
  }
}

async function fetchJson(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`)
  return res
}

async function searchCount(query: string): Promise<number> {
  const res = await fetchJson(
    `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=1`
  )
  const data = (await res.json()) as { total_count: number }
  return data.total_count
}

async function fetchRepo(): Promise<{ pushed_at: string }> {
  const res = await fetchJson(`https://api.github.com/repos/${REPO}`)
  const data = (await res.json()) as { pushed_at: string }
  return data
}

/** Contributor count via the Link header's last page, requesting one per page. */
async function fetchContributorCount(): Promise<number> {
  const res = await fetchJson(
    `https://api.github.com/repos/${REPO}/contributors?per_page=1&anon=false`
  )
  const link = res.headers.get("Link")
  if (link) {
    const match = link.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/)
    if (match) return Number(match[1])
  }
  // No Link header means a single page: count the returned entries.
  const data = (await res.json()) as unknown[]
  return Array.isArray(data) ? data.length : 0
}

export async function getRepoStats(): Promise<RepoStats> {
  const cached = readCache()
  if (cached) return cached

  const [mergedPullRequests, closedIssues, contributors, repo] =
    await Promise.all([
      searchCount(`repo:${REPO} type:pr is:merged`),
      searchCount(`repo:${REPO} type:issue is:closed`),
      fetchContributorCount(),
      fetchRepo(),
    ])

  const stats: RepoStats = {
    mergedPullRequests,
    closedIssues,
    contributors,
    lastPushAt: repo.pushed_at,
  }
  writeCache(stats)
  return stats
}

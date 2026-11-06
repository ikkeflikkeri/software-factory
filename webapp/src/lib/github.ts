/**
 * Shared GitHub API data layer for the dashboard pages.
 *
 * All requests hit the unauthenticated public REST API, so results are
 * cached with a TTL (in-memory plus best-effort sessionStorage) to stay
 * within the 60 requests/hour unauthenticated rate limit.
 */

import type { Status } from "@/lib/status"

export const GITHUB_REPO = "ikkeflikkeri/software-factory"
export const PAGES_WORKFLOW = "webapp-pages"
const API_BASE = "https://api.github.com"
export const CACHE_TTL_MS = 5 * 60 * 1000

type CacheEntry = {
  data: unknown
  fetchedAt: number
}

const memoryCache = new Map<string, CacheEntry>()

function getStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> | null {
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage
  } catch {
    // Storage access can throw in some privacy modes.
  }
  return null
}

function readCache<T>(key: string, now: number): T | null {
  const entry = memoryCache.get(key)
  if (entry && now - entry.fetchedAt <= CACHE_TTL_MS) return entry.data as T
  const raw = getStorage()?.getItem(key)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CacheEntry
    if (now - parsed.fetchedAt > CACHE_TTL_MS) return null
    memoryCache.set(key, parsed)
    return parsed.data as T
  } catch {
    return null
  }
}

function writeCache(key: string, data: unknown, now: number) {
  const entry = { data, fetchedAt: now }
  memoryCache.set(key, entry)
  try {
    getStorage()?.setItem(key, JSON.stringify(entry))
  } catch {
    // Best-effort persistence only.
  }
}

/** Drops all cached entries; used by tests and the retry button. */
export function clearGitHubCache() {
  memoryCache.clear()
  try {
    getStorage()?.removeItem(CACHE_KEY_STATS)
    getStorage()?.removeItem(CACHE_KEY_ACTIVITY)
    getStorage()?.removeItem(CACHE_KEY_DEPLOYMENTS)
  } catch {
    // Ignore.
  }
}

const CACHE_KEY_STATS = "dashboard-overview"
const CACHE_KEY_ACTIVITY = "dashboard-activity"
const CACHE_KEY_DEPLOYMENTS = "dashboard-deployments"

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} for ${url}`)
  }
  return response.json()
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

export type WorkflowRun = {
  id: number
  name: string
  status: string
  conclusion: string | null
  head_sha: string
  head_branch: string | null
  run_started_at: string | null
  updated_at: string
  html_url: string
}

export type DeploymentRun = {
  id: number
  status: Status
  commitSha: string
  commitTitle: string | null
  branch: string | null
  durationMs: number | null
  finishedAt: string | null
  url: string
}

export type ActivityKind = "pr" | "issue"

export type ActivityItem = {
  kind: ActivityKind
  number: number
  title: string
  url: string
  closedAt: string
  actor: string | null
}

export type OverviewStats = {
  mergedPullRequests: number
  closedIssues: number
  openPullRequests: number
  lastActivityAt: string | null
}

/** Maps a workflow run to the dashboard's badge status. */
export function deploymentStatus(run: {
  status: string
  conclusion: string | null
}): Status {
  if (run.status !== "completed") return "building"
  return run.conclusion === "success" ? "success" : "error"
}

export function runDurationMs(run: {
  run_started_at: string | null
  updated_at: string
}): number | null {
  if (!run.run_started_at) return null
  const start = Date.parse(run.run_started_at)
  const end = Date.parse(run.updated_at)
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return Math.max(0, end - start)
}

export function formatDuration(ms: number | null): string {
  if (ms === null || ms < 0) return "—"
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`
}

export function relativeTime(iso: string | null, now: number): string {
  if (!iso) return "—"
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return "—"
  const diff = Math.max(0, now - then)
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function toDeploymentRun(run: WorkflowRun, commitTitle: string | null): DeploymentRun {
  return {
    id: run.id,
    status: deploymentStatus(run),
    commitSha: run.head_sha.slice(0, 7),
    commitTitle,
    branch: run.head_branch,
    durationMs: runDurationMs(run),
    finishedAt: run.status === "completed" ? run.updated_at : null,
    url: run.html_url,
  }
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

type SearchResponse = {
  total_count: number
  items?: Array<{
    number: number
    title: string
    html_url: string
    closed_at: string | null
    user?: { login: string } | null
    pull_request?: unknown
  }>
}

async function searchIssues(query: string, perPage = 1): Promise<SearchResponse> {
  const url = `${API_BASE}/search/issues?q=${encodeURIComponent(query)}&per_page=${perPage}`
  return (await fetchJson(url)) as SearchResponse
}

export async function fetchOverviewStats(now = Date.now()): Promise<OverviewStats> {
  const cached = readCache<OverviewStats>(CACHE_KEY_STATS, now)
  if (cached) return cached

  const [merged, closed, openPrs, recent] = await Promise.all([
    searchIssues(`repo:${GITHUB_REPO} type:pr is:merged`),
    searchIssues(`repo:${GITHUB_REPO} type:issue is:closed`),
    searchIssues(`repo:${GITHUB_REPO} type:pr is:open`),
    searchIssues(`repo:${GITHUB_REPO} is:pr is:merged sort:updated-desc`, 1),
  ])

  const stats: OverviewStats = {
    mergedPullRequests: merged.total_count,
    closedIssues: closed.total_count,
    openPullRequests: openPrs.total_count,
    lastActivityAt: recent.items?.[0]?.closed_at ?? null,
  }
  writeCache(CACHE_KEY_STATS, stats, now)
  return stats
}

export async function fetchActivity(limit = 15, now = Date.now()): Promise<ActivityItem[]> {
  const cached = readCache<ActivityItem[]>(CACHE_KEY_ACTIVITY, now)
  if (cached) return cached.slice(0, limit)

  const [mergedPrs, closedIssues] = await Promise.all([
    searchIssues(`repo:${GITHUB_REPO} type:pr is:merged sort:updated-desc`, limit),
    searchIssues(`repo:${GITHUB_REPO} type:issue is:closed sort:updated-desc`, limit),
  ])

  const toActivity = (kind: ActivityKind) => (item: NonNullable<SearchResponse["items"]>[number]) =>
    ({
      kind,
      number: item.number,
      title: item.title,
      url: item.html_url,
      closedAt: item.closed_at ?? "",
      actor: item.user?.login ?? null,
    }) satisfies ActivityItem

  const items = [
    ...(mergedPrs.items ?? []).map(toActivity("pr")),
    ...(closedIssues.items ?? []).map(toActivity("issue")),
  ]
    .filter((item) => item.closedAt !== "")
    .sort((a, b) => Date.parse(b.closedAt) - Date.parse(a.closedAt))
    .slice(0, limit)

  writeCache(CACHE_KEY_ACTIVITY, items, now)
  return items
}

export async function fetchDeployments(limit = 15, now = Date.now()): Promise<DeploymentRun[]> {
  const cached = readCache<DeploymentRun[]>(CACHE_KEY_DEPLOYMENTS, now)
  if (cached) return cached.slice(0, limit)

  const url = `${API_BASE}/repos/${GITHUB_REPO}/actions/workflows/${PAGES_WORKFLOW}.yml/runs?per_page=${limit}`
  const data = (await fetchJson(url)) as { workflow_runs: WorkflowRun[] }
  const runs = (data.workflow_runs ?? []).slice(0, limit).map((run) => toDeploymentRun(run, null))
  writeCache(CACHE_KEY_DEPLOYMENTS, runs, now)
  return runs
}

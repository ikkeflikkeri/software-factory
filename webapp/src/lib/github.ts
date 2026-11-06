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
    const storage = getStorage()
    if (!storage) return
    for (const key of Object.keys(storage)) {
      if (key.startsWith(CACHE_KEY_PREFIX)) storage.removeItem(key)
    }
  } catch {
    // Ignore.
  }
}

const CACHE_KEY_PREFIX = "dsh-dashboard:"
const cacheKey = (name: string) => `${CACHE_KEY_PREFIX}${name}`
const CACHE_KEY_STATS = cacheKey("overview")
const CACHE_KEY_ACTIVITY = cacheKey("activity")
const CACHE_KEY_DEPLOYMENTS = cacheKey("deployments")

/** Typed GitHub API error so callers can react to specific statuses (e.g. 404). */
export class GitHubApiError extends Error {
  readonly status: number
  readonly url: string

  constructor(status: number, url: string) {
    super(`GitHub API request failed: ${status} for ${url}`)
    this.name = "GitHubApiError"
    this.status = status
    this.url = url
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    throw new GitHubApiError(response.status, url)
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

// ---------------------------------------------------------------------------
// Issue trace (issue -> PRs -> reviews -> merge -> Pages deployment)
// ---------------------------------------------------------------------------

const TRACE_CACHE_KEY = cacheKey("trace")

export type TraceIssue = {
  number: number
  title: string
  url: string
  state: "open" | "closed"
  openedAt: string
  closedAt: string | null
  author: string | null
}

export type TraceReview = {
  id: number
  author: string | null
  state: string
  submittedAt: string
  url: string
}

export type TracePullRequest = {
  number: number
  title: string
  url: string
  state: "open" | "closed"
  mergedAt: string | null
  mergeCommitSha: string | null
  openedAt: string
  author: string | null
  reviews: TraceReview[]
  /** Pages workflow run matching the merge commit, when one exists. */
  deployment: DeploymentRun | null
}

export type IssueTrace = {
  issue: TraceIssue
  pullRequests: TracePullRequest[]
}

type RawIssueLike = {
  number: number
  title?: string
  html_url?: string
  state?: string
  created_at?: string
  closed_at?: string | null
  user?: { login: string } | null
  pull_request?: unknown
}

type RawPullRequest = {
  number: number
  title: string
  html_url: string
  state: string
  created_at: string
  merged_at: string | null
  merge_commit_sha: string | null
  user?: { login: string } | null
}

type RawReview = {
  id: number
  state: string
  submitted_at: string | null
  html_url: string
  user?: { login: string } | null
}

type RawTimelineEvent = {
  event?: string
  source?: { issue?: RawIssueLike }
}

/**
 * PR numbers referenced by an issue timeline. Cross-referenced sources do
 * not reliably carry a `pull_request` marker, so every source number is a
 * candidate; fetchIssueTrace drops non-PR numbers via the pulls API.
 */
export function linkedPrNumbersFromTimeline(events: RawTimelineEvent[]): number[] {
  const numbers = new Set<number>()
  for (const event of events) {
    const source = event.source?.issue
    if (event.event === "cross-referenced" && source) {
      numbers.add(source.number)
    }
  }
  return [...numbers]
}

/** Union of PR numbers found via timeline cross-references and `#<n>` search. */
export function mergeLinkedPrNumbers(timeline: number[], searchItems: RawIssueLike[]): number[] {
  const numbers = new Set(timeline)
  for (const item of searchItems) {
    if (item.pull_request) numbers.add(item.number)
  }
  return [...numbers].sort((a, b) => a - b)
}

function toTraceIssue(issue: RawIssueLike): TraceIssue {
  return {
    number: issue.number,
    title: issue.title ?? "",
    url: issue.html_url ?? "",
    state: issue.state === "closed" ? "closed" : "open",
    openedAt: issue.created_at ?? "",
    closedAt: issue.closed_at ?? null,
    author: issue.user?.login ?? null,
  }
}

function toTraceReview(review: RawReview): TraceReview {
  return {
    id: review.id,
    author: review.user?.login ?? null,
    state: review.state,
    submittedAt: review.submitted_at ?? "",
    url: review.html_url,
  }
}

/** First Pages workflow run whose head commit matches the merge commit. */
export function matchDeploymentRun(
  runs: WorkflowRun[],
  mergeCommitSha: string | null
): DeploymentRun | null {
  if (!mergeCommitSha) return null
  const run = runs.find((candidate) => candidate.head_sha === mergeCommitSha)
  return run ? toDeploymentRun(run, null) : null
}

export async function fetchIssueTrace(issueNumber: number, now = Date.now()): Promise<IssueTrace> {
  const cacheKeyForIssue = `${TRACE_CACHE_KEY}-${issueNumber}`
  const cached = readCache<IssueTrace>(cacheKeyForIssue, now)
  if (cached) return cached

  const issue = (await fetchJson(
    `${API_BASE}/repos/${GITHUB_REPO}/issues/${issueNumber}`
  )) as RawIssueLike

  // Closing references and cross-references arrive via the issue timeline.
  // It is a best-effort source: fall back to `#<n>` search alone on failure.
  let timelineNumbers: number[] = []
  try {
    const events = (await fetchJson(
      `${API_BASE}/repos/${GITHUB_REPO}/issues/${issueNumber}/timeline?per_page=100`
    )) as RawTimelineEvent[]
    timelineNumbers = linkedPrNumbersFromTimeline(Array.isArray(events) ? events : [])
  } catch {
    // Ignore; search below still finds title/body references.
  }

  const search = await searchIssues(
    `repo:${GITHUB_REPO} type:pr #${issueNumber} in:title,body`,
    20
  )

  const numbers = mergeLinkedPrNumbers(timelineNumbers, search.items ?? [])
  const pullRequests = (
    await Promise.all(
      numbers.map(async (number): Promise<TracePullRequest | null> => {
        try {
          const [raw, reviews] = await Promise.all([
            fetchJson(`${API_BASE}/repos/${GITHUB_REPO}/pulls/${number}`) as Promise<RawPullRequest>,
            fetchJson(
              `${API_BASE}/repos/${GITHUB_REPO}/pulls/${number}/reviews?per_page=30`
            ) as Promise<RawReview[]>,
          ])
          return {
            number: raw.number,
            title: raw.title,
            url: raw.html_url,
            state: raw.state === "closed" ? "closed" : "open",
            mergedAt: raw.merged_at,
            mergeCommitSha: raw.merge_commit_sha,
            openedAt: raw.created_at,
            author: raw.user?.login ?? null,
            reviews: (Array.isArray(reviews) ? reviews : [])
              .filter((review) => review.submitted_at)
              .map(toTraceReview)
              .sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt)),
            deployment: null,
          }
        } catch {
          // Timeline candidates may be issues, not pull requests; skip them.
          return null
        }
      })
    )
  ).filter((pr): pr is TracePullRequest => pr !== null)

  // Match Pages deployment runs by merge commit SHA.
  if (pullRequests.some((pr) => pr.mergeCommitSha)) {
    const runsData = (await fetchJson(
      `${API_BASE}/repos/${GITHUB_REPO}/actions/workflows/${PAGES_WORKFLOW}.yml/runs?per_page=30`
    )) as { workflow_runs?: WorkflowRun[] }
    const runs = runsData.workflow_runs ?? []
    for (const pr of pullRequests) {
      pr.deployment = matchDeploymentRun(runs, pr.mergeCommitSha)
    }
  }

  const trace: IssueTrace = {
    issue: toTraceIssue(issue),
    pullRequests: pullRequests.sort((a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt)),
  }
  writeCache(cacheKeyForIssue, trace, now)
  return trace
}

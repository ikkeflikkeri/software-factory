/**
 * Fetches recent merged pull requests and closed issues from the public
 * GitHub REST API. No token is used; callers must handle failure (rate
 * limits, network errors) gracefully.
 */

import { activitySource } from "./homeContent"

export type ActivityKind = "pr" | "issue"

export type ActivityItem = {
  kind: ActivityKind
  number: number
  title: string
  url: string
  /** ISO 8601 timestamp of the merge (PR) or close (issue). */
  closedAt: string
}

type GhPull = {
  number: number
  title: string
  html_url: string
  merged_at: string | null
}

type GhIssue = {
  number: number
  title: string
  html_url: string
  closed_at: string | null
  pull_request?: unknown
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status}`)
  }
  return response.json()
}

export async function fetchActivity(limit = 8): Promise<ActivityItem[]> {
  const base = `https://api.github.com/repos/${activitySource.owner}/${activitySource.repo}`
  const [pulls, issues] = await Promise.all([
    fetchJson(`${base}/pulls?state=closed&sort=updated&direction=desc&per_page=30`) as Promise<GhPull[]>,
    fetchJson(`${base}/issues?state=closed&sort=updated&direction=desc&per_page=30`) as Promise<GhIssue[]>,
  ])

  const prItems: ActivityItem[] = (Array.isArray(pulls) ? pulls : [])
    .filter((pull) => pull.merged_at)
    .map((pull) => ({
      kind: "pr" as const,
      number: pull.number,
      title: pull.title,
      url: pull.html_url,
      closedAt: pull.merged_at as string,
    }))

  const issueItems: ActivityItem[] = (Array.isArray(issues) ? issues : [])
    .filter((issue) => issue.closed_at && !issue.pull_request)
    .map((issue) => ({
      kind: "issue" as const,
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      closedAt: issue.closed_at as string,
    }))

  return [...prItems, ...issueItems]
    .sort((a, b) => b.closedAt.localeCompare(a.closedAt))
    .slice(0, limit)
}

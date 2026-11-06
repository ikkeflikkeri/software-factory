import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  CACHE_TTL_MS,
  clearGitHubCache,
  deploymentStatus,
  fetchDeployments,
  fetchIssueTrace,
  fetchOverviewStats,
  formatDuration,
  GitHubApiError,
  linkedPrNumbersFromTimeline,
  matchDeploymentRun,
  mergeLinkedPrNumbers,
  relativeTime,
  runDurationMs,
  toDeploymentRun,
  type WorkflowRun,
} from "./github"

const NOW = Date.parse("2026-11-06T15:00:00Z")

function makeRun(overrides: Partial<WorkflowRun> = {}): WorkflowRun {
  return {
    id: 123,
    name: "webapp-pages",
    status: "completed",
    conclusion: "success",
    head_sha: "abcdef1234567890",
    head_branch: "main",
    run_started_at: "2026-11-06T14:58:00Z",
    updated_at: "2026-11-06T14:59:12Z",
    html_url: "https://github.com/ikkeflikkeri/software-factory/actions/runs/123",
    ...overrides,
  }
}

function mockFetch(responses: Record<string, unknown>) {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    const body = Object.entries(responses).find(([prefix]) => url.includes(prefix))?.[1]
    if (body === undefined) {
      return Promise.resolve(new Response("{}", { status: 404 }))
    }
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
}

beforeEach(() => {
  clearGitHubCache()
  vi.stubGlobal("fetch", mockFetch({}))
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("deploymentStatus", () => {
  it("maps in-progress runs to building", () => {
    expect(deploymentStatus({ status: "in_progress", conclusion: null })).toBe("building")
    expect(deploymentStatus({ status: "queued", conclusion: null })).toBe("building")
  })

  it("maps completed runs by conclusion", () => {
    expect(deploymentStatus({ status: "completed", conclusion: "success" })).toBe("success")
    expect(deploymentStatus({ status: "completed", conclusion: "failure" })).toBe("error")
    expect(deploymentStatus({ status: "completed", conclusion: "cancelled" })).toBe("error")
  })
})

describe("runDurationMs", () => {
  it("computes the elapsed duration", () => {
    expect(runDurationMs(makeRun())).toBe(72_000)
  })

  it("returns null without a start time", () => {
    expect(runDurationMs(makeRun({ run_started_at: null, status: "in_progress" }))).toBeNull()
  })
})

describe("formatDuration", () => {
  it("formats seconds and minutes", () => {
    expect(formatDuration(9_000)).toBe("9s")
    expect(formatDuration(72_000)).toBe("1m 12s")
    expect(formatDuration(null)).toBe("—")
  })
})

describe("relativeTime", () => {
  it("formats relative ages", () => {
    expect(relativeTime(null, NOW)).toBe("—")
    expect(relativeTime("2026-11-06T14:59:40Z", NOW)).toBe("just now")
    expect(relativeTime("2026-11-06T14:30:00Z", NOW)).toBe("30m ago")
    expect(relativeTime("2026-11-06T10:00:00Z", NOW)).toBe("5h ago")
    expect(relativeTime("2026-11-04T15:00:00Z", NOW)).toBe("2d ago")
  })
})

describe("toDeploymentRun", () => {
  it("maps a workflow run to a deployment row", () => {
    const run = toDeploymentRun(makeRun(), null)
    expect(run).toMatchObject({
      id: 123,
      status: "success",
      commitSha: "abcdef1",
      branch: "main",
      durationMs: 72_000,
      finishedAt: "2026-11-06T14:59:12Z",
    })
  })

  it("keeps running deployments unfinished", () => {
    const run = toDeploymentRun(makeRun({ status: "in_progress", conclusion: null }), null)
    expect(run.status).toBe("building")
    expect(run.finishedAt).toBeNull()
  })
})

describe("caching", () => {
  it("serves a second call from cache without refetching", async () => {
    const search = {
      total_count: 2,
      items: [{ number: 1, title: "t", html_url: "u", closed_at: "2026-11-06T10:00:00Z" }],
    }
    const fetchMock = mockFetch({
      "/search/issues": search,
    })
    vi.stubGlobal("fetch", fetchMock)

    const first = await fetchOverviewStats()
    const second = await fetchOverviewStats()
    expect(second).toEqual(first)
    expect(fetchMock).toHaveBeenCalledTimes(4) // 4 search queries, once
  })

  it("expires cache entries after the TTL", async () => {
    const search = { total_count: 1, items: [] }
    const fetchMock = mockFetch({ "/search/issues": search })
    vi.stubGlobal("fetch", fetchMock)

    await fetchOverviewStats()
    vi.setSystemTime(NOW + CACHE_TTL_MS + 1)
    await fetchOverviewStats()
    expect(fetchMock).toHaveBeenCalledTimes(8)
  })
})

describe("fetchDeployments", () => {
  it("fetches pages workflow runs and maps them", async () => {
    const fetchMock = mockFetch({
      "/actions/workflows": { workflow_runs: [makeRun(), makeRun({ id: 124, conclusion: "failure" })] },
    })
    vi.stubGlobal("fetch", fetchMock)

    const runs = await fetchDeployments()
    expect(runs).toHaveLength(2)
    expect(runs[0].status).toBe("success")
    expect(runs[1].status).toBe("error")
    expect(String(fetchMock.mock.calls[0][0])).toContain("webapp-pages.yml/runs")
  })

  it("throws on API errors so pages can show the error state", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("rate limited", { status: 403 }))))
    await expect(fetchDeployments()).rejects.toThrow("403")
  })
})

describe("issue trace", () => {
  const issue = {
    number: 7,
    title: "Add feature",
    html_url: "https://github.com/ikkeflikkeri/software-factory/issues/7",
    state: "closed",
    created_at: "2026-11-01T10:00:00Z",
    closed_at: "2026-11-03T10:00:00Z",
    user: { login: "ikkeflikkeri" },
  }
  const pr = {
    number: 8,
    title: "Fix #7",
    html_url: "https://github.com/ikkeflikkeri/software-factory/pull/8",
    state: "closed",
    created_at: "2026-11-02T10:00:00Z",
    merged_at: "2026-11-03T09:00:00Z",
    merge_commit_sha: "abcdef1234567890",
    user: { login: "ikkeflikkeri-agent" },
  }
  const timeline = [
    {
      event: "cross-referenced",
      source: { issue: { ...pr, pull_request: {} } },
    },
    {
      event: "cross-referenced",
      source: { issue: { number: 9, title: "other", html_url: "u", state: "open", created_at: "2026-11-02T11:00:00Z", closed_at: null } },
    },
  ]
  const search = { total_count: 1, items: [{ ...pr, pull_request: {} }] }
  const reviews = [
    { id: 1, state: "CHANGES_REQUESTED", submitted_at: "2026-11-02T12:00:00Z", html_url: "https://github.com/ikkeflikkeri/software-factory/pull/8#pullrequestreview-1", user: { login: "ikkeflikkeri" } },
    { id: 2, state: "APPROVED", submitted_at: "2026-11-03T08:00:00Z", html_url: "https://github.com/ikkeflikkeri/software-factory/pull/8#pullrequestreview-2", user: { login: "ikkeflikkeri" } },
  ]
  const runs = { workflow_runs: [makeRun({ head_sha: "abcdef1234567890" })] }

  function mockTraceFetch() {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      let body: unknown
      let status = 200
      if (url.includes("/pulls/8/reviews")) body = reviews
      else if (url.includes("/pulls/8")) body = pr
      else if (url.includes("/pulls/")) {
        body = {}
        status = 404 // timeline candidates that are issues, not PRs
      }
      else if (url.includes("/issues/7/timeline")) body = timeline
      else if (url.includes("/issues/7")) body = issue
      else if (url.includes("/search/issues")) body = search
      else if (url.includes("webapp-pages.yml/runs")) body = runs
      else body = {}
      return Promise.resolve(new Response(JSON.stringify(body), { status }))
    })
    vi.stubGlobal("fetch", fetchMock)
    return fetchMock
  }

  it("assembles issue, PR, reviews and matched deployment", async () => {
    mockTraceFetch()
    const trace = await fetchIssueTrace(7)

    expect(trace.issue).toMatchObject({ number: 7, state: "closed", author: "ikkeflikkeri" })
    expect(trace.pullRequests).toHaveLength(1)
    const tracePr = trace.pullRequests[0]
    expect(tracePr.mergedAt).toBe("2026-11-03T09:00:00Z")
    expect(tracePr.reviews.map((r) => r.state)).toEqual(["CHANGES_REQUESTED", "APPROVED"])
    expect(tracePr.deployment).toMatchObject({ id: 123, status: "success" })
  })

  it("serves a second trace call from cache", async () => {
    const fetchMock = mockTraceFetch()
    await fetchIssueTrace(7)
    await fetchIssueTrace(7)
    // issue + timeline + search + pr + reviews + 2 skipped candidate calls + runs
    expect(fetchMock).toHaveBeenCalledTimes(8)
  })

  it("throws a typed error for a missing issue", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("nope", { status: 404 }))))
    const error = await fetchIssueTrace(999).catch((err: unknown) => err)
    expect(error).toBeInstanceOf(GitHubApiError)
    expect((error as GitHubApiError).status).toBe(404)
  })
})

describe("linkedPrNumbersFromTimeline / mergeLinkedPrNumbers", () => {
  it("keeps every cross-referenced source, ignoring other events", () => {
    const numbers = linkedPrNumbersFromTimeline([
      { event: "cross-referenced", source: { issue: { number: 8 } } },
      { event: "closed", source: { issue: { number: 10 } } },
    ])
    expect(numbers).toEqual([8])
  })

  it("unions and sorts numbers from both sources", () => {
    expect(mergeLinkedPrNumbers([12], [{ number: 5, pull_request: {} }, { number: 12, pull_request: {} }])).toEqual([5, 12])
  })
})

describe("matchDeploymentRun", () => {
  it("matches a run by merge commit sha", () => {
    const run = matchDeploymentRun([makeRun({ head_sha: "aaa" }), makeRun({ id: 9, head_sha: "bbb" })], "bbb")
    expect(run).toMatchObject({ id: 9, commitSha: "bbb" })
  })

  it("returns null without a merge commit or match", () => {
    expect(matchDeploymentRun([makeRun()], null)).toBeNull()
    expect(matchDeploymentRun([makeRun({ head_sha: "aaa" })], "bbb")).toBeNull()
  })
})

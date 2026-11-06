import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  CACHE_TTL_MS,
  clearGitHubCache,
  deploymentStatus,
  fetchDeployments,
  fetchOverviewStats,
  formatDuration,
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

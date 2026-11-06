import { describe, expect, it } from "vitest"
import type { IssueTrace, TracePullRequest } from "./github"
import { buildTraceSteps } from "./trace"

function makePr(overrides: Partial<TracePullRequest> = {}): TracePullRequest {
  return {
    number: 8,
    title: "Fix #7",
    url: "https://github.com/ikkeflikkeri/software-factory/pull/8",
    state: "closed",
    mergedAt: "2026-11-03T09:00:00Z",
    mergeCommitSha: "abcdef1234567890",
    openedAt: "2026-11-02T10:00:00Z",
    author: "ikkeflikkeri-agent",
    reviews: [
      {
        id: 1,
        author: "ikkeflikkeri",
        state: "APPROVED",
        submittedAt: "2026-11-03T08:00:00Z",
        url: "https://github.com/ikkeflikkeri/software-factory/pull/8#pullrequestreview-1",
      },
    ],
    deployment: null,
    ...overrides,
  }
}

function makeTrace(overrides: Partial<IssueTrace> = {}): IssueTrace {
  return {
    issue: {
      number: 7,
      title: "Add feature",
      url: "https://github.com/ikkeflikkeri/software-factory/issues/7",
      state: "closed",
      openedAt: "2026-11-01T10:00:00Z",
      closedAt: "2026-11-03T10:00:00Z",
      author: "ikkeflikkeri",
    },
    pullRequests: [makePr()],
    ...overrides,
  }
}

describe("buildTraceSteps", () => {
  it("shows completed steps in pipeline order for a merged issue", () => {
    const steps = buildTraceSteps(makeTrace())
    expect(steps.map((s) => s.title)).toEqual([
      "Issue #7 opened",
      "PR #8 opened",
      "PR #8 approved",
      "PR #8 merged",
      "Pages deployment run",
    ])
    expect(steps.slice(0, 4).every((s) => s.status === "done")).toBe(true)
    expect(steps[3].detail).toBe("abcdef1")
  })

  it("marks the deployment pending when no run matches the merge commit", () => {
    const steps = buildTraceSteps(makeTrace())
    const deployment = steps[steps.length - 1]
    expect(deployment.status).toBe("pending")
    expect(deployment.detail).toBe("not found yet")
  })

  it("marks the deployment done when a run matched", () => {
    const steps = buildTraceSteps(
      makeTrace({
        pullRequests: [
          makePr({
            deployment: {
              id: 123,
              status: "success",
              commitSha: "abcdef1",
              commitTitle: null,
              branch: "main",
              durationMs: 72_000,
              finishedAt: "2026-11-03T09:02:00Z",
              url: "https://github.com/ikkeflikkeri/software-factory/actions/runs/123",
            },
          }),
        ],
      })
    )
    const deployment = steps[steps.length - 1]
    expect(deployment.status).toBe("done")
    expect(deployment.deploymentStatus).toBe("success")
    expect(deployment.url).toContain("/actions/runs/123")
    expect(steps.every((s) => s.status === "done")).toBe(true)
  })

  it("renders pending PR, review, merge and deployment steps for an open issue", () => {
    const steps = buildTraceSteps(
      makeTrace({
        issue: { ...makeTrace().issue, state: "open" },
        pullRequests: [makePr({ state: "open", mergedAt: null, mergeCommitSha: null, reviews: [] })],
      })
    )
    expect(steps.map((s) => `${s.title}|${s.status}`)).toEqual([
      "Issue #7 opened|done",
      "PR #8 opened|done",
      "PR #8 reviewed|pending",
      "PR #8 merged|pending",
      "Pages deployment run|pending",
    ])
  })

  it("renders a single pending PR step when no PR is linked", () => {
    const steps = buildTraceSteps(makeTrace({ pullRequests: [] }))
    expect(steps.map((s) => s.status)).toEqual(["done", "pending"])
    expect(steps[1].detail).toBe("not found yet")
  })
})

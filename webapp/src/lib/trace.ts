import type { IssueTrace, TracePullRequest } from "@/lib/github"

/**
 * Derives the display order of trace timeline steps from an IssueTrace.
 * Steps that have not happened yet are emitted with status "pending" so the
 * view can render them as "not found yet".
 */

export type TraceStepKind = "issue" | "pr" | "review" | "merge" | "deployment"

export type TraceStep = {
  key: string
  kind: TraceStepKind
  status: "done" | "pending"
  title: string
  detail: string | null
  url: string | null
  at: string | null
  /** Deployment badge status when the step is a finished deployment. */
  deploymentStatus?: "success" | "error" | "building"
}

function prLabel(pr: TracePullRequest): string {
  return `PR #${pr.number}`
}

export function buildTraceSteps(trace: IssueTrace): TraceStep[] {
  const steps: TraceStep[] = [
    {
      key: "issue-opened",
      kind: "issue",
      status: "done",
      title: `Issue #${trace.issue.number} opened`,
      detail: trace.issue.title,
      url: trace.issue.url,
      at: trace.issue.openedAt,
    },
  ]

  if (trace.pullRequests.length === 0) {
    steps.push({
      key: "pr-opened-pending",
      kind: "pr",
      status: "pending",
      title: "Linked pull request opened",
      detail: "not found yet",
      url: null,
      at: null,
    })
  }

  for (const pr of trace.pullRequests) {
    steps.push({
      key: `pr-${pr.number}-opened`,
      kind: "pr",
      status: "done",
      title: `${prLabel(pr)} opened`,
      detail: pr.title,
      url: pr.url,
      at: pr.openedAt,
    })

    if (pr.reviews.length === 0) {
      steps.push({
        key: `pr-${pr.number}-review-pending`,
        kind: "review",
        status: "pending",
        title: `${prLabel(pr)} reviewed`,
        detail: "not found yet",
        url: null,
        at: null,
      })
    } else {
      for (const review of pr.reviews) {
        steps.push({
          key: `pr-${pr.number}-review-${review.id}`,
          kind: "review",
          status: "done",
          title: `${prLabel(pr)} ${reviewVerb(review.state)}`,
          detail: review.author ? `by ${review.author}` : null,
          url: review.url,
          at: review.submittedAt,
        })
      }
    }

    if (pr.mergedAt) {
      steps.push({
        key: `pr-${pr.number}-merged`,
        kind: "merge",
        status: "done",
        title: `${prLabel(pr)} merged`,
        detail: pr.mergeCommitSha ? pr.mergeCommitSha.slice(0, 7) : null,
        url: pr.url,
        at: pr.mergedAt,
      })
      steps.push({
        key: `pr-${pr.number}-deployment`,
        kind: "deployment",
        status: pr.deployment ? "done" : "pending",
        title: "Pages deployment run",
        detail: pr.deployment ? null : "not found yet",
        url: pr.deployment?.url ?? null,
        at: pr.deployment?.finishedAt ?? null,
        deploymentStatus: pr.deployment?.status,
      })
    } else {
      steps.push({
        key: `pr-${pr.number}-merged-pending`,
        kind: "merge",
        status: "pending",
        title: `${prLabel(pr)} merged`,
        detail: "not found yet",
        url: null,
        at: null,
      })
      steps.push({
        key: `pr-${pr.number}-deployment-pending`,
        kind: "deployment",
        status: "pending",
        title: "Pages deployment run",
        detail: "not found yet",
        url: null,
        at: null,
      })
    }
  }

  return steps
}

export function reviewVerb(state: string): string {
  switch (state) {
    case "APPROVED":
      return "approved"
    case "CHANGES_REQUESTED":
      return "changes requested"
    case "DISMISSED":
      return "review dismissed"
    default:
      return "reviewed"
  }
}

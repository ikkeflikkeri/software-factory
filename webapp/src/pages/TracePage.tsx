import { AlertCircle, ArrowLeft, CircleDot, GitMerge, GitPullRequest, MessageSquare, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { fetchIssueTrace, GitHubApiError, relativeTime, type IssueTrace } from "@/lib/github"
import { buildTraceSteps, type TraceStep } from "@/lib/trace"
import { navigate } from "@/lib/router"
import { useAsync, useNow } from "@/lib/useAsync"
import { cn } from "cn"

const RATE_LIMIT_HINT =
  "GitHub API request failed. This site uses unauthenticated requests; please try again in a few minutes."

const stepIcons = {
  issue: CircleDot,
  pr: GitPullRequest,
  review: MessageSquare,
  merge: GitMerge,
  deployment: Rocket,
} as const

function StepRow({ step, now }: { step: TraceStep; now: number }) {
  const Icon = stepIcons[step.kind]
  return (
    <li className="relative flex gap-3 px-4 py-3">
      <span
        className={cn(
          "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background",
          step.status === "done" ? "border-border" : "border-dashed border-border"
        )}
        aria-hidden="true"
      >
        <Icon className={cn("size-3.5", step.status === "done" ? "text-muted-foreground" : "text-muted-foreground/60")} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className={cn("text-[13px]", step.status === "pending" && "text-muted-foreground")}>
          {step.url ? (
            <a href={step.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
              {step.title}
            </a>
          ) : (
            <span className="font-medium">{step.title}</span>
          )}
          {step.status === "pending" && step.detail ? (
            <span className="font-normal text-muted-foreground/80"> — {step.detail}</span>
          ) : null}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {step.status === "done" && step.deploymentStatus ? (
            <StatusBadge status={step.deploymentStatus} />
          ) : null}
          {step.status === "done" && step.detail ? <span className="font-mono">{step.detail}</span> : null}
          {step.status === "done" ? <span>{relativeTime(step.at, now)}</span> : null}
        </p>
      </div>
    </li>
  )
}

export function TracePage({ issueNumber }: { issueNumber: number }) {
  const now = useNow()
  const trace = useAsync(() => fetchIssueTrace(issueNumber), [issueNumber])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={trace.state === "ready" ? `Trace #${issueNumber}` : "Trace"}
        description={
          trace.state === "ready" ? (
            <a
              href={trace.data.issue.url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {trace.data.issue.title}
            </a>
          ) : (
            `Pipeline timeline for issue #${issueNumber}`
          )
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("/activity")}>
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Activity
          </Button>
        }
      />

      {trace.state === "loading" ? (
        <section className="rounded-lg border border-border bg-card p-4" aria-busy="true" aria-label="Loading trace">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="mb-2 h-9 animate-pulse rounded-md bg-muted" />
          ))}
        </section>
      ) : trace.state === "error" ? (
        <NotFoundOrError issueNumber={issueNumber} error={trace.error} reload={trace.reload} />
      ) : (
        <TraceTimeline trace={trace.data} now={now} />
      )}
    </div>
  )
}

function NotFoundOrError({
  issueNumber,
  error,
  reload,
}: {
  issueNumber: number
  error: Error
  reload: () => void
}) {
  if (error instanceof GitHubApiError && error.status === 404) {
    return (
      <section className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={AlertCircle}
          title={`Issue #${issueNumber} not found`}
          description="No issue with this number exists in this repository. Check the number and try again."
        />
      </section>
    )
  }
  return (
    <EmptyState
      icon={AlertCircle}
      title="Could not load trace"
      description={RATE_LIMIT_HINT}
      action={
        <Button variant="outline" size="sm" onClick={reload}>
          Try again
        </Button>
      }
    />
  )
}

function TraceTimeline({ trace, now }: { trace: IssueTrace; now: number }) {
  const steps = buildTraceSteps(trace)
  return (
    <section className="rounded-lg border border-border bg-card" aria-label="Pipeline trace timeline">
      <ol className="relative divide-y divide-border/60">
        {steps.map((step) => (
          <StepRow key={step.key} step={step} now={now} />
        ))}
      </ol>
    </section>
  )
}

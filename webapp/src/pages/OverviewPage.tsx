import { Activity, CircleDot, GitPullRequest, GitPullRequestClosed, Rocket } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/EmptyState"
import { StatusBadge } from "@/components/StatusBadge"
import {
  fetchActivity,
  fetchDeployments,
  fetchOverviewStats,
  formatDuration,
  relativeTime,
  type ActivityItem,
  type DeploymentRun,
} from "@/lib/github"
import { useAsync, useNow } from "@/lib/useAsync"
import { PageHeader } from "@/components/PageHeader"

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold tracking-tight">{value}</span>
      </div>
      <Icon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-border bg-card">
      <header className="flex h-10 items-center border-b border-border px-4 text-[13px] font-medium">
        {title}
      </header>
      {children}
    </section>
  )
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-5 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}

function ErrorPanel({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <Panel title={title}>
      <EmptyState
        icon={CircleDot}
        title="Could not load data"
        description={message}
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    </Panel>
  )
}

const RATE_LIMIT_HINT =
  "GitHub API request failed. This site uses unauthenticated requests; please try again in a few minutes."

function ActivityRow({ item, now }: { item: ActivityItem; now: number }) {
  const Icon = item.kind === "pr" ? GitPullRequest : GitPullRequestClosed
  return (
    <li className="flex min-w-0 items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 items-center gap-2 hover:underline"
      >
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">
          <span className="text-muted-foreground">#{item.number}</span> {item.title}
        </span>
      </a>
      <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(item.closedAt, now)}</span>
    </li>
  )
}

export function OverviewPage() {
  const now = useNow()
  const stats = useAsync(() => fetchOverviewStats(), [])
  const activity = useAsync(() => fetchActivity(6), [])
  const deployments = useAsync(() => fetchDeployments(4), [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description="Live status of the dsh-superagent pipeline, fed by the GitHub API."
      />

      {stats.state === "ready" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Merged PRs" value={String(stats.data.mergedPullRequests)} icon={GitPullRequest} />
          <StatCard label="Closed issues" value={String(stats.data.closedIssues)} icon={GitPullRequestClosed} />
          <StatCard label="Open PRs" value={String(stats.data.openPullRequests)} icon={Activity} />
          <StatCard label="Last activity" value={relativeTime(stats.data.lastActivityAt, now)} icon={Rocket} />
        </div>
      ) : stats.state === "error" ? (
        <ErrorPanel title="Repository stats" message={RATE_LIMIT_HINT} onRetry={stats.reload} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-lg border border-border bg-muted/50" />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {activity.state === "ready" ? (
          activity.data.length === 0 ? (
            <Panel title="Recent activity">
              <EmptyState icon={Activity} title="No recent activity" description="Merged pull requests and closed issues will appear here." />
            </Panel>
          ) : (
            <Panel title="Recent activity">
              <ul className="divide-y divide-border/60">
                {activity.data.map((item) => (
                  <ActivityRow key={`${item.kind}-${item.number}`} item={item} now={now} />
                ))}
              </ul>
            </Panel>
          )
        ) : activity.state === "error" ? (
          <ErrorPanel title="Recent activity" message={RATE_LIMIT_HINT} onRetry={activity.reload} />
        ) : (
          <Panel title="Recent activity">
            <PanelSkeleton rows={5} />
          </Panel>
        )}

        <DeploymentsPanel state={deployments} now={now} />
      </div>
    </div>
  )
}

function DeploymentsPanel({ state, now }: { state: ReturnType<typeof useAsync<DeploymentRun[]>>; now: number }) {
  if (state.state === "ready") {
    return (
      <Panel title="Deployments">
        {state.data.length === 0 ? (
          <EmptyState icon={Rocket} title="No deployments yet" description="Pages deployments of webapp will appear here once the workflow has run." />
        ) : (
          <ul className="divide-y divide-border/60">
            {state.data.map((run) => (
              <li key={run.id} className="flex min-w-0 items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
                <a
                  href={run.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-2 hover:underline"
                >
                  <StatusBadge status={run.status} />
                  <span className="truncate font-mono text-xs text-muted-foreground">{run.commitSha}</span>
                  <span className="truncate text-muted-foreground">on {run.branch ?? "unknown"}</span>
                </a>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {run.finishedAt ? relativeTime(run.finishedAt, now) : formatDuration(run.durationMs)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    )
  }
  if (state.state === "error") {
    return <ErrorPanel title="Deployments" message={RATE_LIMIT_HINT} onRetry={state.reload} />
  }
  return (
    <Panel title="Deployments">
      <PanelSkeleton rows={4} />
    </Panel>
  )
}

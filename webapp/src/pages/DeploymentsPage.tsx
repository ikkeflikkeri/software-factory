import { CircleDot, Clock, ExternalLink, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable, type DataTableColumn } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { useMemo } from "react"
import { fetchDeployments, formatDuration, relativeTime, type DeploymentRun } from "@/lib/github"
import { useAsync, useNow } from "@/lib/useAsync"

const RATE_LIMIT_HINT =
  "GitHub API request failed. This site uses unauthenticated requests; please try again in a few minutes."

function makeColumns(now: number): DataTableColumn<DeploymentRun>[] { return [
  {
    key: "status",
    header: "Status",
    sortable: true,
    sortValue: (row) => row.status,
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "commitSha",
    header: "Commit",
    sortable: true,
    sortValue: (row) => row.commitSha,
    render: (row) => (
      <a href={row.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-xs hover:underline">
        {row.commitSha}
        <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
      </a>
    ),
  },
  {
    key: "branch",
    header: "Branch",
    sortable: true,
    sortValue: (row) => row.branch ?? "",
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <GitBranch className="size-3.5" aria-hidden="true" />
        {row.branch ?? "—"}
      </span>
    ),
  },
  {
    key: "durationMs",
    header: "Duration",
    sortable: true,
    sortValue: (row) => row.durationMs ?? -1,
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Clock className="size-3.5" aria-hidden="true" />
        {formatDuration(row.durationMs)}
      </span>
    ),
  },
  {
    key: "finishedAt",
    header: "Finished",
    sortable: true,
    sortValue: (row) => row.finishedAt ?? "",
    render: (row) => (
      <a href={row.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:underline">
        {relativeTime(row.finishedAt, now)}
      </a>
    ),
  },
] }

export function DeploymentsPage() {
  const now = useNow()
  const columns = useMemo(() => makeColumns(now), [now])
  const deployments = useAsync(() => fetchDeployments(20), [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Deployments"
        description="Recent GitHub Pages deployment workflow runs for webapp."
      />

      {deployments.state === "loading" ? (
        <div className="rounded-lg border border-border bg-card p-4" aria-busy="true" aria-label="Loading deployments">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="mb-2 h-6 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : deployments.state === "error" ? (
        <EmptyState
          icon={CircleDot}
          title="Could not load deployments"
          description={RATE_LIMIT_HINT}
          action={
            <Button variant="outline" size="sm" onClick={deployments.reload}>
              Try again
            </Button>
          }
        />
      ) : deployments.data.length === 0 ? (
        <EmptyState
          icon={CircleDot}
          title="No deployments yet"
          description="Pages deployments of webapp will appear here once the webapp-pages workflow has run."
        />
      ) : (
        <section className="rounded-lg border border-border bg-card">
          <DataTable
            columns={columns}
            rows={deployments.data}
            rowKey={(row) => String(row.id)}
          />
        </section>
      )}
    </div>
  )
}

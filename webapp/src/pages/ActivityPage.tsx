import { useState } from "react"
import { Activity, CircleDot, GitPullRequest, GitPullRequestClosed, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { fetchActivity, relativeTime, type ActivityItem } from "@/lib/github"
import { navigate } from "@/lib/router"
import { useAsync, useNow } from "@/lib/useAsync"

const RATE_LIMIT_HINT =
  "GitHub API request failed. This site uses unauthenticated requests; please try again in a few minutes."

function TimelineRow({ item, now }: { item: ActivityItem; now: number }) {
  const Icon = item.kind === "pr" ? GitPullRequest : GitPullRequestClosed
  const verb = item.kind === "pr" ? "Merged" : "Closed"
  return (
    <li className="relative flex gap-3 px-4 py-3">
      <span className="relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[13px]">
          <span className="text-muted-foreground">{verb} </span>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
          >
            #{item.number} {item.title}
          </a>
        </p>
        <p className="text-xs text-muted-foreground">
          {item.actor ? `by ${item.actor} · ` : ""}
          {relativeTime(item.closedAt, now)}
        </p>
      </div>
    </li>
  )
}

function TraceForm() {
  const [value, setValue] = useState("")
  const trimmed = value.trim()
  const valid = /^\d+$/.test(trimmed)

  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) navigate(`/trace/${trimmed}`)
      }}
    >
      <div className="flex min-w-48 flex-col gap-1">
        <label htmlFor="trace-issue-number" className="text-xs font-medium text-muted-foreground">
          Open a trace by issue number
        </label>
        <Input
          id="trace-issue-number"
          inputMode="numeric"
          placeholder="e.g. 7"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-40"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={!valid}>
        <Search className="size-3.5" aria-hidden="true" />
        View trace
      </Button>
    </form>
  )
}

export function ActivityPage() {
  const now = useNow()
  const activity = useAsync(() => fetchActivity(30), [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Activity"
        description="Recent merged pull requests and closed issues."
      />

      <TraceForm />

      {activity.state === "loading" ? (
        <section className="rounded-lg border border-border bg-card p-4" aria-busy="true" aria-label="Loading activity">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="mb-2 h-9 animate-pulse rounded-md bg-muted" />
          ))}
        </section>
      ) : activity.state === "error" ? (
        <EmptyState
          icon={CircleDot}
          title="Could not load activity"
          description={RATE_LIMIT_HINT}
          action={
            <Button variant="outline" size="sm" onClick={activity.reload}>
              Try again
            </Button>
          }
        />
      ) : activity.data.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="Merged pull requests and closed issues will appear here."
        />
      ) : (
        <section className="rounded-lg border border-border bg-card">
          <ol className="relative divide-y divide-border/60">
            {activity.data.map((item) => (
              <TimelineRow key={`${item.kind}-${item.number}`} item={item} now={now} />
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

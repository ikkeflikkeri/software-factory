import { useEffect, useState } from "react"
import { CircleCheck, GitPullRequestArrow } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { activitySource } from "./homeContent"
import { fetchActivity, type ActivityItem } from "./githubActivity"

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
})

function ActivityRow({ item }: { item: ActivityItem }) {
  const isPr = item.kind === "pr"
  const Icon = isPr ? GitPullRequestArrow : CircleCheck
  return (
    <li className="flex items-start gap-3">
      <Icon
        aria-hidden
        className={`mt-0.5 size-4 shrink-0 ${
          isPr ? "text-purple-500" : "text-green-500"
        }`}
      />
      <div className="min-w-0 flex-1">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="block truncate font-medium hover:underline"
          title={item.title}
        >
          {item.title}
        </a>
        <p className="text-xs text-muted-foreground">
          {isPr ? "Merged pull request" : "Closed issue"} #{item.number} ·{" "}
          <time dateTime={item.closedAt}>
            {dateFormatter.format(new Date(item.closedAt))}
          </time>
        </p>
      </div>
    </li>
  )
}

function ActivitySkeleton() {
  return (
    <ul aria-hidden className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="mt-0.5 size-4 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex w-full flex-col gap-1.5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ActivitySection() {
  const [items, setItems] = useState<ActivityItem[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchActivity()
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Error fallback: hide the section when the API is unavailable.
  if (failed) return null

  return (
    <section aria-label="Recent activity" className="pb-16 md:pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            Recently merged pull requests and closed issues in{" "}
            <a
              href={`https://github.com/${activitySource.owner}/${activitySource.repo}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {activitySource.owner}/{activitySource.repo}
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items === null ? (
            <ActivitySkeleton />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <ActivityRow key={`${item.kind}-${item.number}`} item={item} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

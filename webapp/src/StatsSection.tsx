import { useEffect, useState } from "react"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getRepoStats, type RepoStats } from "./repoStats"

function formatLastPush(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

type StatCard = {
  label: string
  value: string
}

function statCards(stats: RepoStats): StatCard[] {
  const lastPush = formatLastPush(stats.lastPushAt)
  return [
    { label: "Merged pull requests", value: String(stats.mergedPullRequests) },
    { label: "Closed issues", value: String(stats.closedIssues) },
    { label: "Contributors", value: String(stats.contributors) },
    ...(lastPush ? [{ label: "Last activity", value: lastPush }] : []),
  ]
}

/**
 * Live stats strip summarizing what the pipeline has delivered.
 * Renders nothing while loading or when the GitHub API is unreachable.
 */
export function StatsSection() {
  const [stats, setStats] = useState<RepoStats | null>(null)

  useEffect(() => {
    let cancelled = false
    getRepoStats()
      .then((s) => {
        if (!cancelled) setStats(s)
      })
      .catch(() => {
        // Graceful fallback: leave the section hidden on failure.
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!stats) return null

  const cards = statCards(stats)

  return (
    <section aria-label="Repository stats" className="pb-16 md:pb-24">
      <ul className="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label}>
            <Card size="sm" className="h-full">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">
                  {card.value}
                </CardTitle>
                <CardDescription>{card.label}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}

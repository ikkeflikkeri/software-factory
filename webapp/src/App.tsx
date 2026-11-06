import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GitPullRequest, GitBranch, MessageSquare, UserCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { ActivitySection } from "./ActivitySection"
import { StatsSection } from "./StatsSection"
import { appName, features, hero, howItWorksHeading, steps } from "./homeContent"

const stepIcons = {
  issue: MessageSquare,
  route: GitBranch,
  "pull-request": GitPullRequest,
  review: UserCheck,
} satisfies Record<(typeof steps)[number]["icon"], LucideIcon>

function App() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto w-full max-w-5xl px-4 py-4">
          <span className="text-lg font-semibold tracking-tight">{appName}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="flex flex-col items-start gap-6 py-16 md:py-24">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {hero.headline}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            {hero.description}
          </p>
          <Button size="lg">{hero.ctaLabel}</Button>
        </section>

        <section aria-label="Key features" className="pb-16 md:pb-24">
          <ul className="grid list-none gap-6 sm:grid-cols-1 md:grid-cols-3">
            {features.map((feature) => (
              <li key={feature.title}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <StatsSection />
        <ActivitySection />

        <section aria-label="How it works" className="pb-16 md:pb-24">
          <h2 className="text-3xl font-bold tracking-tight">
            {howItWorksHeading.title}
          </h2>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            {howItWorksHeading.description}
          </p>
          <ol className="mt-8 grid list-none gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = stepIcons[step.icon]
              return (
                <li key={step.title}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-muted">
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-base">{step.title}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </li>
              )
            })}
          </ol>
        </section>
      </main>
    </div>
  )
}

export default App

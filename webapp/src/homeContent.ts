/**
 * Central place for the homepage copy and feature list.
 * All strings below are placeholders — to be replaced by the owner.
 */

export const appName = "Software Factory"

/**
 * Repository whose recent activity is shown in the Activity section.
 */
export const activitySource = {
  owner: "ikkeflikkeri",
  repo: "software-factory",
}

export const hero = {
  headline: "Placeholder headline: build software faster",
  description:
    "Placeholder description: a short sentence explaining what this product does and why it matters.",
  ctaLabel: "Get started",
}

export type Step = {
  title: string
  description: string
  icon: "issue" | "route" | "pull-request" | "review"
}

export const howItWorksHeading = {
  title: "How it works",
  description:
    "From idea to merged code in four steps — the whole pipeline runs itself, you stay in control of the review.",
}

export const steps: Step[] = [
  {
    title: "1. Open a GitHub issue",
    description:
      "Describe the change you want directly in a GitHub issue. No forms, no new tools — just plain text where your work already lives.",
    icon: "issue",
  },
  {
    title: "2. The orchestrator routes it",
    description:
      "The orchestrator agent picks up your request, assesses the scope and hands it to a worker agent that owns the task.",
    icon: "route",
  },
  {
    title: "3. A worker opens a PR",
    description:
      "The worker investigates the code, implements the change, runs the relevant checks and opens a pull request with the result.",
    icon: "pull-request",
  },
  {
    title: "4. You review and merge",
    description:
      "A human reviews the pull request and merges it. Feedback on the PR loops straight back into the pipeline.",
    icon: "review",
  },
]

export type Feature = {
  title: string
  description: string
}

export const features: Feature[] = [
  {
    title: "Feature one",
    description:
      "Placeholder copy describing the first key feature of the product.",
  },
  {
    title: "Feature two",
    description:
      "Placeholder copy describing the second key feature of the product.",
  },
  {
    title: "Feature three",
    description:
      "Placeholder copy describing the third key feature of the product.",
  },
]

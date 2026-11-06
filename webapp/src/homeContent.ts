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

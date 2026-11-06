import { useCallback, useEffect, useState } from "react"

/**
 * Minimal history-based routing. The app is deployed to GitHub Pages, so
 * paths are resolved relative to the Vite base and deep links fall back to
 * index.html via a 404.html copy.
 */

export type Route =
  | { name: "section"; section: string }
  | { name: "trace"; issueNumber: number }
  | { name: "not-found" }

export const SECTION_IDS = ["overview", "deployments", "activity", "settings"] as const

export function basePath(): string {
  const base = import.meta.env.BASE_URL ?? "/"
  return base.endsWith("/") ? base.slice(0, -1) : base
}

export function parsePath(pathname: string): Route {
  const base = basePath()
  const rel = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname
  const parts = rel.split("/").filter(Boolean)
  if (parts.length === 0) return { name: "section", section: "overview" }
  if (parts[0] === "trace") {
    if (parts[1] !== undefined && /^\d+$/.test(parts[1])) {
      return { name: "trace", issueNumber: Number(parts[1]) }
    }
    return { name: "not-found" }
  }
  if ((SECTION_IDS as readonly string[]).includes(parts[0])) {
    return { name: "section", section: parts[0] }
  }
  return { name: "not-found" }
}

export function useRoute(): { route: Route; navigate: (path: string) => void } {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined" ? { name: "section", section: "overview" } : parsePath(window.location.pathname)
  )

  useEffect(() => {
    const onPopState = () => setRoute(parsePath(window.location.pathname))
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const navigate = useCallback((path: string) => {
    const url = path.startsWith("http") ? path : `${basePath()}${path}`
    window.history.pushState(null, "", url)
    setRoute(parsePath(window.location.pathname))
  }, [])

  return { route, navigate }
}

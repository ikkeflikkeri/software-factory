import { useEffect, useState } from "react"

/**
 * Base path the app is served from ("" when hosted at the domain root,
 * "/<repo name>" on GitHub Pages). Derived from the Vite `base` option.
 */
function basePath(): string {
  const base = import.meta.env.BASE_URL ?? "/"
  return base.endsWith("/") ? base.slice(0, -1) : base
}

/** Strip the deployment base path and trailing slashes from a pathname. */
export function normalizePath(pathname: string): string {
  let path = pathname
  const base = basePath()
  if (base && path.startsWith(base)) {
    path = path.slice(base.length)
  }
  if (!path.startsWith("/")) {
    path = `/${path}`
  }
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1)
  }
  return path
}

/** Absolute href for an app-internal path, including the base path. */
export function href(to: string): string {
  return `${basePath()}${to}`
}

/** Subscribe to location changes (popstate) and expose the normalized path. */
export function usePathname(): string {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setPathname(normalizePath(window.location.pathname))
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  return pathname
}

/** Navigate to an app-internal path without a full page reload. */
export function navigate(to: string): void {
  window.history.pushState(null, "", href(to))
  window.dispatchEvent(new PopStateEvent("popstate"))
}

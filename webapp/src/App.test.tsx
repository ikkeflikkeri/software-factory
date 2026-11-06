// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLElement

beforeEach(() => {
  window.history.replaceState(null, "", "/")
  // The dashboard pages fetch live GitHub data; keep them in the loading
  // state so tests do not hit the network.
  vi.stubGlobal("fetch", () => new Promise(() => {}))
  container = document.createElement("div")
  document.body.appendChild(container)
})

afterEach(() => {
  container.remove()
  vi.unstubAllGlobals()
})

function renderApp() {
  const root = createRoot(container)
  act(() => root.render(<App />))
  return root
}

describe("App routing", () => {
  it("shows the 404 page with a link home for unknown routes", () => {
    window.history.replaceState(null, "", "/does-not-exist")
    renderApp()

    expect(container.textContent).toContain("Page not found")
    const link = container.querySelector("a[href='/']") as HTMLAnchorElement | null
    expect(link).not.toBeNull()
    expect(link!.textContent).toContain("Back to Overview")
  })

  it("keeps the sidebar on the 404 page", () => {
    window.history.replaceState(null, "", "/does-not-exist")
    renderApp()

    const sidebar = container.querySelector("aside")
    expect(sidebar).not.toBeNull()
    expect(sidebar!.textContent).toContain("Deployments")
  })

  it("renders the dashboard content for a deep link to /deployments", () => {
    window.history.replaceState(null, "", "/deployments")
    renderApp()

    expect(container.textContent).not.toContain("Page not found")
    expect(container.textContent).toContain("Deployments")
  })

  it("navigates from the sidebar without a page reload", () => {
    renderApp()

    const settingsItem = [...container.querySelectorAll("button, a")].find(
      (el) => el.textContent?.trim() === "Settings",
    )
    expect(settingsItem).toBeDefined()
    act(() => (settingsItem as HTMLElement).click())

    expect(window.location.pathname).toBe("/settings")
    expect(container.textContent).toContain("Nothing to configure")

    const overviewItem = [...container.querySelectorAll("button, a")].find(
      (el) => el.textContent?.trim() === "Overview",
    )
    act(() => (overviewItem as HTMLElement).click())
    expect(window.location.pathname).toBe("/")
  })
})

describe("App routing (trace)", () => {
  it("renders the trace page for /trace/:issueNumber", () => {
    window.history.replaceState(null, "", "/trace/7")
    renderApp()

    expect(container.textContent).toContain("Pipeline timeline for issue #7")
    expect(container.textContent).not.toContain("Page not found")
  })

  it("does not treat malformed trace paths as a trace route", () => {
    window.history.replaceState(null, "", "/trace/not-a-number")
    renderApp()

    expect(container.textContent).toContain("Page not found")
  })
})

describe("App auth gate", () => {
  const CLIENT_ID = "test-client.apps.googleusercontent.com"

  function b64url(json: unknown): string {
    return btoa(JSON.stringify(json))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }

  function signIn(): void {
    const credential = `${b64url({ alg: "RS256" })}.${b64url({
      iss: "https://accounts.google.com",
      aud: CLIENT_ID,
      sub: "1234567890",
      exp: Math.floor(Date.now() / 1000) + 3600,
      name: "Test User",
      picture: "https://example.com/a.png",
    })}.sig`
    window.localStorage.setItem(
      "software-factory.google-session",
      JSON.stringify({
        credential,
        expiresAt: Date.now() + 3_600_000,
        user: {
          id: "1234567890",
          email: "user@example.com",
          name: "Test User",
          picture: "https://example.com/a.png",
        },
      }),
    )
  }

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllEnvs()
  })

  it("shows the sign-in page instead of the dashboard when signed out", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", CLIENT_ID)
    window.history.replaceState(null, "", "/deployments")
    renderApp()

    expect(container.textContent).toContain("Sign in required")
    expect(container.textContent).not.toContain("Deployments")
  })

  it("shows the dashboard and the user's name for a signed-in visitor", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", CLIENT_ID)
    signIn()
    window.history.replaceState(null, "", "/deployments")
    renderApp()

    expect(container.textContent).not.toContain("Sign in required")
    expect(container.textContent).toContain("Deployments")
    expect(container.textContent).toContain("Test User")
    expect(container.querySelector("button[aria-label='Sign out']")).not.toBeNull()
  })

  it("keeps the dashboard public when no client ID is configured", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "")
    window.history.replaceState(null, "", "/settings")
    renderApp()

    expect(container.textContent).not.toContain("Sign in required")
    expect(container.textContent).toContain("Nothing to configure")
  })
})

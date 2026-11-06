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

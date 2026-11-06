// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RouteErrorBoundary } from "./RouteErrorBoundary"

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLElement

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
})

afterEach(() => {
  container.remove()
})

function render(element: React.ReactElement) {
  const root = createRoot(container)
  act(() => root.render(element))
  return root
}

function Boom(): never {
  throw new Error("boom")
}

describe("RouteErrorBoundary", () => {
  it("renders the fallback UI instead of the crashed route content", () => {
    render(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>,
    )

    expect(container.querySelector("[role='alert']")).not.toBeNull()
    expect(container.textContent).toContain("Something went wrong")
    expect(container.textContent).toContain("Try again")
    expect(container.textContent).not.toContain("route content")
  })

  it("logs the caught error to the console", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>,
    )

    expect(errorSpy).toHaveBeenCalled()
    const logged = errorSpy.mock.calls.map((call) => call.map(String).join(" ")).join("\n")
    expect(logged).toContain("Route rendering error:")
    expect(logged).toContain("boom")
    errorSpy.mockRestore()
  })

  it("recovers when Try again is clicked and the error is gone", () => {
    let throwing = true
    function Flaky() {
      if (throwing) throw new Error("boom")
      return <p>route content</p>
    }

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <RouteErrorBoundary>
        <Flaky />
      </RouteErrorBoundary>,
    )

    throwing = false
    const button = [...container.querySelectorAll("button")].find(
      (el) => el.textContent === "Try again",
    )
    expect(button).toBeDefined()
    act(() => button!.click())

    expect(container.textContent).toContain("route content")
    expect(container.textContent).not.toContain("Try again")
    errorSpy.mockRestore()
  })
})

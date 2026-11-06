import { describe, expect, it, vi } from "vitest"
import { href, normalizePath } from "./router"

describe("normalizePath", () => {
  it("keeps known root-level paths as-is", () => {
    expect(normalizePath("/")).toBe("/")
    expect(normalizePath("/deployments")).toBe("/deployments")
  })

  it("collapses trailing slashes", () => {
    expect(normalizePath("/deployments/")).toBe("/deployments")
  })

  it("marks unknown paths as not found by leaving them intact", () => {
    expect(normalizePath("/does-not-exist")).toBe("/does-not-exist")
  })
})

describe("normalizePath with a base path (GitHub Pages)", () => {
  it("strips the deployment base path", () => {
    vi.stubEnv("BASE_URL", "/software-factory/")
    expect(normalizePath("/software-factory/deployments")).toBe("/deployments")
    expect(normalizePath("/software-factory/")).toBe("/")
    vi.unstubAllEnvs()
  })
})

describe("href", () => {
  it("links back to the base-rooted overview", () => {
    expect(href("/")).toBe("/")
    vi.stubEnv("BASE_URL", "/software-factory/")
    expect(href("/")).toBe("/software-factory/")
    vi.unstubAllEnvs()
  })
})

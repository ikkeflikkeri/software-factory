import { afterEach, describe, expect, it, vi } from "vitest"
import { basePath, parsePath } from "./router"

describe("parsePath", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("resolves sections and the default route", () => {
    expect(parsePath("/")).toEqual({ name: "section", section: "overview" })
    expect(parsePath("/activity")).toEqual({ name: "section", section: "activity" })
    expect(parsePath("/deployments/")).toEqual({ name: "section", section: "deployments" })
  })

  it("parses trace routes with an issue number", () => {
    expect(parsePath("/trace/7")).toEqual({ name: "trace", issueNumber: 7 })
    expect(parsePath("/trace/042")).toEqual({ name: "trace", issueNumber: 42 })
  })

  it("rejects malformed trace paths and unknown sections", () => {
    expect(parsePath("/trace/abc")).toEqual({ name: "not-found" })
    expect(parsePath("/trace/")).toEqual({ name: "not-found" })
    expect(parsePath("/nope")).toEqual({ name: "not-found" })
  })

  it("strips the deployment base path", () => {
    vi.stubEnv("BASE_URL", "/software-factory/")
    expect(basePath()).toBe("/software-factory")
    expect(parsePath("/software-factory/trace/7")).toEqual({ name: "trace", issueNumber: 7 })
    expect(parsePath("/software-factory/")).toEqual({ name: "section", section: "overview" })
  })
})

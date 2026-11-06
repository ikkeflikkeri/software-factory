import { describe, expect, it } from "vitest"
import { statusStylesFor, type Status } from "./status"

describe("statusStylesFor", () => {
  it("maps every status to a label", () => {
    const statuses: Status[] = ["success", "error", "building"]
    for (const status of statuses) {
      expect(statusStylesFor(status).label.length).toBeGreaterThan(0)
    }
  })

  it("uses distinct indicators per status", () => {
    const styles = (["success", "error", "building"] as Status[]).map(statusStylesFor)
    expect(new Set(styles.map((s) => s.dot)).size).toBe(3)
    expect(new Set(styles.map((s) => s.label)).size).toBe(3)
  })
})

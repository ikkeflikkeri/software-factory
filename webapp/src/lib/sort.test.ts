import { describe, expect, it } from "vitest"
import {
  compareValues,
  nextSortDirection,
  sortRows,
} from "./sort"

describe("nextSortDirection", () => {
  it("sorts ascending when clicking a new column", () => {
    expect(nextSortDirection(null, null, "name")).toEqual({
      columnKey: "name",
      direction: "asc",
    })
    expect(nextSortDirection("age", "desc", "name")).toEqual({
      columnKey: "name",
      direction: "asc",
    })
  })

  it("toggles asc -> desc -> unsorted for the active column", () => {
    expect(nextSortDirection("name", "asc", "name")).toEqual({
      columnKey: "name",
      direction: "desc",
    })
    expect(nextSortDirection("name", "desc", "name")).toBeNull()
  })
})

describe("compareValues", () => {
  it("compares numbers numerically", () => {
    expect(compareValues(3, 10)).toBeLessThan(0)
    expect(compareValues(10, 3)).toBeGreaterThan(0)
    expect(compareValues(5, 5)).toBe(0)
  })

  it("compares strings lexicographically and pushes nullish last", () => {
    expect(compareValues("abc", "abd")).toBeLessThan(0)
    expect(compareValues(null, "a")).toBeGreaterThan(0)
  })
})

describe("sortRows", () => {
  const rows = [
    { id: "1", name: "webapp", count: 3 },
    { id: "2", name: "docs", count: 10 },
    { id: "3", name: "api", count: 1 },
  ]
  const getValue = (row: (typeof rows)[number], key: string) =>
    row[key as keyof (typeof rows)[number]]

  it("returns a copy in original order when unsorted", () => {
    expect(sortRows(rows, null, null, getValue)).not.toBe(rows)
    expect(sortRows(rows, null, null, getValue).map((r) => r.id)).toEqual(["1", "2", "3"])
  })

  it("sorts ascending and descending by the given column", () => {
    expect(sortRows(rows, "name", "asc", getValue).map((r) => r.name)).toEqual([
      "api",
      "docs",
      "webapp",
    ])
    expect(sortRows(rows, "count", "desc", getValue).map((r) => r.count)).toEqual([10, 3, 1])
  })
})

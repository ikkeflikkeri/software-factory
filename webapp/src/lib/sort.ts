export type SortDirection = "asc" | "desc"

export function nextSortDirection(
  columnKey: string | null,
  direction: SortDirection | null,
  clickedKey: string
): { columnKey: string; direction: SortDirection } | null {
  if (columnKey !== clickedKey) {
    return { columnKey: clickedKey, direction: "asc" }
  }
  if (direction === "asc") {
    return { columnKey: clickedKey, direction: "desc" }
  }
  return null
}

export function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b))
}

export function sortRows<T>(
  rows: readonly T[],
  columnKey: string | null,
  direction: SortDirection | null,
  getValue: (row: T, columnKey: string) => unknown
): T[] {
  if (!columnKey || !direction) return [...rows]
  const sorted = [...rows].sort((a, b) =>
    compareValues(getValue(a, columnKey), getValue(b, columnKey))
  )
  return direction === "asc" ? sorted : sorted.reverse()
}

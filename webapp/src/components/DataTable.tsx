import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import { cn } from "cn"
import {
  nextSortDirection,
  sortRows,
  type SortDirection,
} from "@/lib/sort"

export type DataTableColumn<Row> = {
  key: string
  header: string
  sortable?: boolean
  align?: "left" | "right"
  render: (row: Row) => React.ReactNode
  sortValue?: (row: Row) => string | number
}

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[]
  rows: readonly Row[]
  rowKey: (row: Row) => string
  emptyState?: React.ReactNode
  className?: string
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  emptyState,
  className,
}: DataTableProps<Row>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null)

  const sortedRows = useMemo(() => {
    const getSortValue = (row: Row, columnKey: string) => {
      const column = columns.find((c) => c.key === columnKey)
      if (column?.sortValue) return column.sortValue(row)
      return row[columnKey as keyof Row]
    }
    return sortRows(rows, sortColumn, sortDirection, getSortValue)
  }, [rows, columns, sortColumn, sortDirection])

  function toggleSort(columnKey: string) {
    const next = nextSortDirection(sortColumn, sortDirection, columnKey)
    setSortColumn(next?.columnKey ?? null)
    setSortDirection(next?.direction ?? null)
  }

  if (rows.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => {
              const active = sortColumn === column.key
              const SortIcon =
                active && sortDirection === "asc"
                  ? ArrowUp
                  : active && sortDirection === "desc"
                    ? ArrowDown
                    : ChevronsUpDown
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    active
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={cn(
                    "h-9 px-3 text-left font-medium text-muted-foreground",
                    column.align === "right" && "text-right"
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-md px-1 font-medium transition-colors hover:text-foreground",
                        column.align === "right" && "flex-row-reverse",
                        active && "text-foreground"
                      )}
                    >
                      {column.header}
                      <SortIcon className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "h-9 px-3 whitespace-nowrap",
                    column.align === "right" && "text-right"
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

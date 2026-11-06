import { cn } from "cn"
import { statusStylesFor, type Status } from "@/lib/status"

export type { Status } from "@/lib/status"

export function StatusBadge({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  const { dot, label } = statusStylesFor(status)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />
      {label}
    </span>
  )
}

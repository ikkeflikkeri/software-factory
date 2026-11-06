export type Status = "success" | "error" | "building"

export type StatusStyle = {
  dot: string
  label: string
}

const statusStyles: Record<Status, StatusStyle> = {
  success: { dot: "bg-emerald-500", label: "Success" },
  error: { dot: "bg-red-500", label: "Error" },
  building: { dot: "bg-amber-500 animate-pulse", label: "Building" },
}

export function statusStylesFor(status: Status): StatusStyle {
  return statusStyles[status]
}

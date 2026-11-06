import { cn } from "cn"

export type NavItem = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

type SidebarNavProps = {
  items: NavItem[]
  activeId: string
  onSelect?: (id: string) => void
  className?: string
}

export function SidebarNav({ items, activeId, onSelect, className }: SidebarNavProps) {
  return (
    <nav aria-label="Main navigation" className={cn("flex flex-col gap-0.5", className)}>
      {items.map((item) => {
        const Icon = item.icon
        const active = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect?.(item.id)}
            className={cn(
              "flex h-8 items-center gap-2 rounded-md px-2 text-[13px] font-medium transition-colors",
              "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

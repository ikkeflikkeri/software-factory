import { useCallback, useEffect, useState } from "react"
import {
  ChevronRight,
  CircleDot,
  Search,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarNav } from "@/components/SidebarNav"
import { CommandPalette } from "@/components/CommandPalette"
import { navItems } from "@/lib/nav"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { OverviewPage } from "@/pages/OverviewPage"
import { DeploymentsPage } from "@/pages/DeploymentsPage"
import { ActivityPage } from "@/pages/ActivityPage"

const isMac =
  typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

function DashboardTopBar({ section, onOpenSearch }: { section: string; onOpenSearch: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between gap-4 border-b border-border bg-background/95 px-6 backdrop-blur">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]">
        <span className="text-muted-foreground">software-factory</span>
        <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">{section}</span>
      </nav>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSearch}
          aria-label="Open command palette"
          aria-keyshortcuts="Control+K Meta+K"
          className="gap-2 text-muted-foreground"
        >
          <Search className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-sans text-[10px] font-medium text-muted-foreground">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </Button>
        <Button variant="outline" size="sm">Feedback</Button>
        <div
          className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-[11px] font-semibold text-muted-foreground"
          title="ikkeflikkeri"
        >
          ik
        </div>
      </div>
    </header>
  )
}

function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Dashboard settings are not configurable yet." />
      <section className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={Settings}
          title="Nothing to configure"
          description="This dashboard reads public GitHub data only; there are no settings yet."
        />
      </section>
    </div>
  )
}

function App() {
  const [activeId, setActiveId] = useState("overview")
  const [paletteOpen, setPaletteOpen] = useState(false)
  const activeItem = navItems.find((item) => item.id === activeId) ?? navItems[0]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const openPalette = useCallback(() => setPaletteOpen(true), [])

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-12 items-center gap-2 border-b border-sidebar-border px-4">
          <CircleDot className="size-4" aria-hidden="true" />
          <span className="text-[13px] font-semibold tracking-tight">software-factory</span>
        </div>
        <SidebarNav
          items={navItems}
          activeId={activeId}
          onSelect={setActiveId}
          className="px-2 py-3"
        />
        <div className="mt-auto border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
          dsh-superagent pipeline
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pl-56">
        <DashboardTopBar section={activeItem.label} onOpenSearch={openPalette} />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={setActiveId} />
        <main className="flex flex-col gap-6 px-6 py-6">
          {activeId === "overview" ? <OverviewPage /> : null}
          {activeId === "deployments" ? <DeploymentsPage /> : null}
          {activeId === "activity" ? <ActivityPage /> : null}
          {activeId === "settings" ? <SettingsPage /> : null}
        </main>
      </div>
    </div>
  )
}

export default App

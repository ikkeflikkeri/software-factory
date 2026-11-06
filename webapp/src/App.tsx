import { useState } from "react"
import {
  Activity,
  ChevronRight,
  CircleDot,
  LayoutDashboard,
  Rocket,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarNav, type NavItem } from "@/components/SidebarNav"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { OverviewPage } from "@/pages/OverviewPage"
import { DeploymentsPage } from "@/pages/DeploymentsPage"
import { ActivityPage } from "@/pages/ActivityPage"

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "deployments", label: "Deployments", icon: Rocket },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
]

function DashboardTopBar({ section }: { section: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between gap-4 border-b border-border bg-background/95 px-6 backdrop-blur">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]">
        <span className="text-muted-foreground">software-factory</span>
        <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">{section}</span>
      </nav>
      <div className="flex items-center gap-3">
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
  const activeItem = navItems.find((item) => item.id === activeId) ?? navItems[0]

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
        <DashboardTopBar section={activeItem.label} />
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

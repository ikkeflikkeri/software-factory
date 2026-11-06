import { useState } from "react"
import {
  Activity,
  ChevronRight,
  CircleDot,
  LayoutDashboard,
  Menu,
  Rocket,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarNav, type NavItem } from "@/components/SidebarNav"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary"
import { OverviewPage } from "@/pages/OverviewPage"
import { DeploymentsPage } from "@/pages/DeploymentsPage"
import { ActivityPage } from "@/pages/ActivityPage"
import { NotFound } from "@/pages/NotFound"
import { navigate, usePathname } from "@/lib/router"

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "deployments", label: "Deployments", icon: Rocket },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
]

/** Maps app paths to the nav section they belong to. */
const routes: Record<string, string> = {
  "/": "overview",
  "/deployments": "deployments",
  "/activity": "activity",
  "/settings": "settings",
}

function pathFor(sectionId: string): string {
  return Object.keys(routes).find((path) => routes[path] === sectionId) ?? "/"
}

function DashboardTopBar({ section, onOpenNav }: { section: string; onOpenNav: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={onOpenNav}
        >
          <Menu className="size-4" aria-hidden="true" />
        </Button>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]">
          <span className="text-muted-foreground">software-factory</span>
          <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium">{section}</span>
        </nav>
      </div>
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
  const pathname = usePathname()
  const activeSection = routes[pathname]
  const activeItem = navItems.find((item) => item.id === activeSection)
  const [navOpen, setNavOpen] = useState(false)

  function selectNav(id: string) {
    setNavOpen(false)
    navigate(pathFor(id))
  }

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-12 items-center gap-2 border-b border-sidebar-border px-4">
          <CircleDot className="size-4" aria-hidden="true" />
          <span className="text-[13px] font-semibold tracking-tight">software-factory</span>
        </div>
        <SidebarNav
          items={navItems}
          activeId={activeItem?.id ?? ""}
          onSelect={selectNav}
          className="px-2 py-3"
        />
        <div className="mt-auto border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
          dsh-superagent pipeline
        </div>
      </aside>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          className="w-64 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetHeader className="border-b border-sidebar-border px-4 py-3">
            <SheetTitle className="flex h-6 items-center gap-2 text-[13px] font-semibold tracking-tight">
              <CircleDot className="size-4" aria-hidden="true" />
              software-factory
            </SheetTitle>
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
          </SheetHeader>
          <SidebarNav
            items={navItems}
            activeId={activeItem?.id ?? ""}
            onSelect={selectNav}
            className="px-2 py-3"
          />
          <div className="mt-auto border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
            dsh-superagent pipeline
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col md:pl-56">
        <DashboardTopBar
          section={activeItem?.label ?? "Not found"}
          onOpenNav={() => setNavOpen(true)}
        />
        <main className="flex flex-col gap-6 px-4 py-6 md:px-6">
          {activeSection === "overview" ? (
            <RouteErrorBoundary key={pathname}>
              <OverviewPage />
            </RouteErrorBoundary>
          ) : null}
          {activeSection === "deployments" ? (
            <RouteErrorBoundary key={pathname}>
              <DeploymentsPage />
            </RouteErrorBoundary>
          ) : null}
          {activeSection === "activity" ? (
            <RouteErrorBoundary key={pathname}>
              <ActivityPage />
            </RouteErrorBoundary>
          ) : null}
          {activeSection === "settings" ? (
            <RouteErrorBoundary key={pathname}>
              <SettingsPage />
            </RouteErrorBoundary>
          ) : null}
          {activeItem === undefined ? <NotFound /> : null}
        </main>
      </div>
    </div>
  )
}

export default App

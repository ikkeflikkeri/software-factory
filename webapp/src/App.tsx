import { useState } from "react"
import {
  Activity,
  ChevronRight,
  CircleDot,
  Clock,
  GitBranch,
  LayoutDashboard,
  Rocket,
  Settings,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarNav, type NavItem } from "@/components/SidebarNav"
import { DataTable, type DataTableColumn } from "@/components/DataTable"
import { StatusBadge, type Status } from "@/components/StatusBadge"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"

type Deployment = {
  id: string
  name: string
  branch: string
  status: Status
  duration: string
  age: string
}

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "deployments", label: "Deployments", icon: Rocket },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
]

const deployments: Deployment[] = [
  { id: "1", name: "webapp", branch: "main", status: "success", duration: "1m 12s", age: "2h ago" },
  { id: "2", name: "webapp", branch: "agent/dashboard-shell", status: "building", duration: "0m 38s", age: "just now" },
  { id: "3", name: "webapp", branch: "feat/geist-tokens", status: "error", duration: "0m 54s", age: "5h ago" },
  { id: "4", name: "docs", branch: "main", status: "success", duration: "0m 41s", age: "1d ago" },
]

const activityItems = [
  { id: "1", text: "PR #35 merged into main", time: "2h ago" },
  { id: "2", text: "Deployment of webapp succeeded", time: "2h ago" },
  { id: "3", text: "Issue #36 assigned to agent", time: "4h ago" },
  { id: "4", text: "Branch feat/geist-tokens created", time: "5h ago" },
]

const deploymentColumns: DataTableColumn<Deployment>[] = [
  {
    key: "name",
    header: "Project",
    sortable: true,
    render: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: "branch",
    header: "Branch",
    sortable: true,
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <GitBranch className="size-3.5" aria-hidden="true" />
        {row.branch}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    sortValue: (row) => row.status,
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "duration",
    header: "Duration",
    sortable: true,
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Clock className="size-3.5" aria-hidden="true" />
        {row.duration}
      </span>
    ),
  },
  {
    key: "age",
    header: "Age",
    sortable: true,
    render: (row) => <span className="text-muted-foreground">{row.age}</span>,
  },
]

type StatCardProps = {
  label: string
  value: string
  icon: LucideIcon
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold tracking-tight">{value}</span>
      </div>
      <Icon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
    </div>
  )
}

function PlaceholderPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex h-10 items-center border-b border-border px-4 text-[13px] font-medium">
        {title}
      </header>
      {children}
    </section>
  )
}

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
          <PageHeader
            title="Overview"
            description="Status of the dsh-superagent pipeline and its deployments."
            actions={<Button size="sm">New deployment</Button>}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active branches" value="12" icon={GitBranch} />
            <StatCard label="Deployments (24h)" value="8" icon={Rocket} />
            <StatCard label="Success rate" value="96%" icon={CircleDot} />
            <StatCard label="Open issues" value="3" icon={Activity} />
          </div>

          <PlaceholderPanel title="Recent deployments">
            <DataTable
              columns={deploymentColumns}
              rows={deployments}
              rowKey={(row) => row.id}
            />
          </PlaceholderPanel>

          <div className="grid gap-4 lg:grid-cols-2">
            <PlaceholderPanel title="Pipeline activity">
              <ul className="divide-y divide-border/60">
                {activityItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
                    <span>{item.text}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
                  </li>
                ))}
              </ul>
            </PlaceholderPanel>

            <PlaceholderPanel title="Connected repositories">
              <EmptyState
                icon={GitBranch}
                title="No repositories connected"
                description="Connect a repository to start tracking its deployments and pipeline activity."
                action={<Button variant="outline" size="sm">Connect repository</Button>}
              />
            </PlaceholderPanel>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App

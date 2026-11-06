import { Activity, LayoutDashboard, Rocket, Settings } from "lucide-react"
import type { NavItem } from "@/components/SidebarNav"

export const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "deployments", label: "Deployments", icon: Rocket },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
]

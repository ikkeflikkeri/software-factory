import { ExternalLink } from "lucide-react"
import { navItems } from "@/lib/nav"
import type { NavItem } from "@/components/SidebarNav"

export const GITHUB_URL = "https://github.com/ikkeflikkeri/software-factory"

export type CommandAction =
  | { kind: "navigate"; pageId: string }
  | { kind: "link"; href: string }

export type CommandEntry = {
  id: string
  label: string
  keywords: string
  icon: NavItem["icon"]
  group: string
  action: CommandAction
}

export const commands: CommandEntry[] = [
  ...navItems.map((item) => ({
    id: `go-${item.id}`,
    label: item.label,
    keywords: `go navigate ${item.label} ${item.id}`.toLowerCase(),
    icon: item.icon,
    group: "Navigation",
    action: { kind: "navigate", pageId: item.id } as CommandAction,
  })),
  {
    id: "github-repository",
    label: "GitHub repository",
    keywords: "github repo source code issues".toLowerCase(),
    icon: ExternalLink,
    group: "Links",
    action: { kind: "link", href: GITHUB_URL },
  },
]

export const commandGroups: string[] = [...new Set(commands.map((c) => c.group))]

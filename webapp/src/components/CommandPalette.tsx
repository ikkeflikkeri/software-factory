import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { commandGroups, commands } from "@/lib/commands"

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (pageId: string) => void
}

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  const runCommand = (id: string) => {
    const command = commands.find((entry) => entry.id === id)
    if (!command) return
    onOpenChange(false)
    if (command.action.kind === "navigate") {
      onNavigate(command.action.pageId)
    } else {
      window.open(command.action.href, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Search for a page or command to run"
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {commandGroups.map((group) => (
          <CommandGroup key={group} heading={group}>
            {commands
              .filter((command) => command.group === group)
              .map((command) => {
                const Icon = command.icon
                return (
                  <CommandItem
                    key={command.id}
                    value={`${command.label} ${command.keywords}`}
                    onSelect={() => runCommand(command.id)}
                  >
                    <Icon aria-hidden="true" />
                    {command.label}
                  </CommandItem>
                )
              })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

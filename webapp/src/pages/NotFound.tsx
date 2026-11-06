import { FileQuestion } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import { buttonVariants } from "@/components/ui/button"
import { href } from "@/lib/router"
import { cn } from "cn"

/** Shown for any path that does not match a dashboard route. */
export function NotFound() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
      action={
        <a href={href("/")} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Back to Overview
        </a>
      }
    />
  )
}

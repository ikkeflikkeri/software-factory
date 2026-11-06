import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

type RouteErrorBoundaryProps = {
  children: ReactNode
}

type RouteErrorBoundaryState = {
  error: Error | null
}

/**
 * Catches rendering errors inside a dashboard route so the shell (sidebar,
 * top bar) keeps working, and offers a "Try again" reset.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Route rendering error:", error, info.componentStack)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center"
        >
          <p className="text-[13px] font-medium text-foreground">
            Something went wrong while displaying this page.
          </p>
          <p className="max-w-sm text-[13px] text-muted-foreground">
            The error has been logged to the console.
          </p>
          <Button variant="outline" size="sm" onClick={this.reset} className="mt-2">
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

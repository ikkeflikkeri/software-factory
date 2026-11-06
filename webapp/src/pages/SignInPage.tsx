import { useEffect, useRef } from "react"
import { CircleDot } from "lucide-react"
import { useAuth } from "@/lib/useAuth"

/**
 * Full-page sign-in screen shown to signed-out visitors when Google sign-in
 * is configured. Renders the official "Sign in with Google" button and an
 * error state instead of crashing when sign-in fails.
 */
export function SignInPage() {
  const { gsiReady, gsiError } = useAuth()
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!gsiReady || !buttonRef.current || !window.google) return
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
    })
  }, [gsiReady])

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 text-foreground">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-lg border border-border bg-card p-8 text-center">
        <div className="flex items-center gap-2 text-foreground">
          <CircleDot className="size-5" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">software-factory</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-lg font-semibold">Sign in required</h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            The dashboard is restricted to signed-in users. Sign in with your Google account to
            continue.
          </p>
        </div>
        <div ref={buttonRef} className="flex min-h-10 items-center justify-center" />
        {!gsiReady && gsiError === null ? (
          <p className="text-xs text-muted-foreground" role="status">
            Loading Google sign-in…
          </p>
        ) : null}
        {gsiError !== null ? (
          <p className="text-xs text-destructive" role="alert">
            {gsiError}
          </p>
        ) : null}
      </div>
    </div>
  )
}

import { useCallback, useEffect, useState } from "react"
import {
  clearSession,
  getClientId,
  isSessionValid,
  loadSession,
  saveSession,
  sessionFromCredential,
  type AuthSession,
  type GsiCredentialResponse,
} from "@/lib/auth"

const GSI_SCRIPT_ID = "google-gsi-script"
const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client"

let cachedSession: AuthSession | null = null
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

function setSession(session: AuthSession | null): void {
  cachedSession = session
  notify()
}

/** Load the GIS script once and report readiness via the callback. */
function loadGsiScript(onReady: () => void, onError: () => void): void {
  const existing = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null
  if (window.google?.accounts?.id) {
    onReady()
    return
  }
  if (existing) {
    existing.addEventListener("load", onReady, { once: true })
    existing.addEventListener("error", onError, { once: true })
    return
  }
  const script = document.createElement("script")
  script.id = GSI_SCRIPT_ID
  script.src = GSI_SCRIPT_SRC
  script.async = true
  script.defer = true
  script.addEventListener("load", onReady, { once: true })
  script.addEventListener("error", onError, { once: true })
  document.head.appendChild(script)
}

/**
 * Google sign-in state for the app shell: session, GIS script status and the
 * sign-out action. When no client ID is configured (`VITE_GOOGLE_CLIENT_ID`
 * unset), sign-in is disabled and the dashboard stays publicly accessible.
 */
export function useAuth() {
  const clientId = getClientId()
  const configured = clientId !== undefined

  const [session, setLocalSession] = useState<AuthSession | null>(() =>
    clientId !== undefined ? loadSession(clientId) : null,
  )
  const [gsiReady, setGsiReady] = useState(false)
  const [gsiError, setGsiError] = useState<string | null>(null)

  useEffect(() => {
    const update = () => setLocalSession(cachedSession ?? (clientId !== undefined ? loadSession(clientId) : null))
    listeners.add(update)
    update()
    return () => {
      listeners.delete(update)
    }
  }, [clientId])

  // Periodically drop the session once its ID token has expired.
  useEffect(() => {
    if (session === null) return
    if (!isSessionValid(session)) {
      clearSession()
      setSession(null)
      return
    }
    const timer = window.setInterval(() => {
      if (!isSessionValid(cachedSession)) {
        clearSession()
        setSession(null)
      }
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [session])

  // Load and initialize the GIS library when a client ID is configured.
  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    loadGsiScript(
      () => {
        if (cancelled) return
        setGsiReady(true)
        window.google?.accounts.id.initialize({
          client_id: clientId,
          use_fedcm_for_prompt: true,
          callback: (response: GsiCredentialResponse) => {
            const next = sessionFromCredential(response.credential, clientId)
            if (next === null) {
              setGsiError("Google sign-in failed: the returned identity token was rejected.")
              return
            }
            setGsiError(null)
            saveSession(next)
            setSession(next)
          },
        })
      },
      () => {
        if (!cancelled) {
          setGsiError("Could not load Google sign-in. Check your network and try again.")
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [clientId])

  const signOut = useCallback(() => {
    try {
      window.google?.accounts.id.disableAutoSelect()
    } catch {
      /* GIS not initialized; local sign-out is enough */
    }
    clearSession()
    setSession(null)
  }, [])

  return { clientId, configured, session, gsiReady, gsiError, signOut }
}

/**
 * Google Identity Services (GIS) sign-in helpers.
 *
 * Uses the ID-token credential model ("Sign in with Google" button): Google
 * returns a JWT ID token to the browser callback, no client secret and no
 * backend are involved. The session is kept in localStorage and expires with
 * the ID token's `exp` claim.
 */

/** Claims of a Google ID token that this app relies on. */
export interface IdTokenClaims {
  iss: string
  aud: string
  exp: number
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

/** Signed-in user as shown in the UI. */
export interface GoogleUser {
  id: string
  email: string | null
  name: string
  picture: string | null
}

/** Persisted session; `expiresAt` is the ID token `exp` in milliseconds. */
export interface AuthSession {
  credential: string
  expiresAt: number
  user: GoogleUser
}

const SESSION_KEY = "software-factory.google-session"

/** Tolerance for clock skew when checking token expiry (30 s). */
const EXPIRY_SKEW_MS = 30_000

/** GIS ID tokens are issued by these issuers. */
const VALID_ISSUERS = ["accounts.google.com", "https://accounts.google.com"]

/** The OAuth client ID, exposed to the browser via a `VITE_` variable. */
export function getClientId(): string | undefined {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID
  return typeof id === "string" && id.length > 0 ? id : undefined
}

/** Decode the payload of a JWT without verifying its signature. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Build an AuthSession from a GIS credential (ID token), or null when the
 * token is malformed or its basic claims (issuer, audience, expiry) do not
 * match what this app expects. This is a sanity check for the UI, not a
 * cryptographic verification — see the README trade-off notes.
 */
export function sessionFromCredential(credential: string, clientId: string): AuthSession | null {
  const payload = decodeJwtPayload(credential)
  if (!payload) return null
  const iss = typeof payload.iss === "string" ? payload.iss : ""
  const aud = typeof payload.aud === "string" ? payload.aud : ""
  const exp = typeof payload.exp === "number" ? payload.exp : NaN
  const sub = typeof payload.sub === "string" ? payload.sub : ""
  if (!VALID_ISSUERS.includes(iss)) return null
  if (aud !== clientId) return null
  if (!Number.isFinite(exp) || sub.length === 0) return null
  const expiresAt = exp * 1000
  if (expiresAt <= Date.now() - EXPIRY_SKEW_MS) return null
  return {
    credential,
    expiresAt,
    user: {
      id: sub,
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" && payload.name.length > 0 ? payload.name : "Google user",
      picture: typeof payload.picture === "string" ? payload.picture : null,
    },
  }
}

/** Read the persisted session, dropping it when it has expired. */
export function loadSession(clientId: string): AuthSession | null {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const session = sessionFromCredential(JSON.parse(raw).credential, clientId)
    if (session) return session
  } catch {
    /* fall through to clearing the stored value */
  }
  clearSession()
  return null
}

/** Persist the session (credential token plus display fields). */
export function saveSession(session: AuthSession): void {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* storage unavailable (private mode): session lives in memory only */
  }
}

/** Remove the persisted session. */
export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    /* nothing to clean up */
  }
}

/** True while the session's ID token is still valid. */
export function isSessionValid(session: AuthSession | null): boolean {
  return session !== null && session.expiresAt > Date.now() - EXPIRY_SKEW_MS
}

/* Minimal typings for the Google Identity Services browser API. */
export interface GsiCredentialResponse {
  credential: string
}

interface GsiIdApi {
  initialize(config: {
    client_id: string
    callback: (response: GsiCredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    use_fedcm_for_prompt?: boolean
  }): void
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void
  disableAutoSelect(): void
  prompt(): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GsiIdApi } }
  }
}

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  clearSession,
  decodeJwtPayload,
  isSessionValid,
  loadSession,
  saveSession,
  sessionFromCredential,
  type AuthSession,
} from "./auth"

const CLIENT_ID = "test-client.apps.googleusercontent.com"

function b64url(json: unknown): string {
  return btoa(JSON.stringify(json))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function token(claims: Record<string, unknown>): string {
  return `${b64url({ alg: "RS256" })}.${b64url(claims)}.signature`
}

function validClaims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    iss: "https://accounts.google.com",
    aud: CLIENT_ID,
    sub: "1234567890",
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: "user@example.com",
    email_verified: true,
    name: "Test User",
    picture: "https://example.com/avatar.png",
    ...overrides,
  }
}

function makeSession(): AuthSession {
  const credential = token(validClaims())
  const session = sessionFromCredential(credential, CLIENT_ID)
  expect(session).not.toBeNull()
  return session!
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe("decodeJwtPayload", () => {
  it("decodes a base64url JWT payload", () => {
    expect(decodeJwtPayload(token({ hello: "world" }))).toEqual({ hello: "world" })
  })

  it("returns null for malformed tokens", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull()
    expect(decodeJwtPayload("a.!!!.c")).toBeNull()
  })
})

describe("sessionFromCredential", () => {
  it("builds a session from a valid ID token", () => {
    const session = makeSession()
    expect(session.user).toEqual({
      id: "1234567890",
      email: "user@example.com",
      name: "Test User",
      picture: "https://example.com/avatar.png",
    })
    expect(session.expiresAt).toBeGreaterThan(Date.now())
  })

  it("rejects a token issued to a different client", () => {
    expect(sessionFromCredential(token(validClaims({ aud: "other-client" })), CLIENT_ID)).toBeNull()
  })

  it("rejects an unexpected issuer", () => {
    expect(sessionFromCredential(token(validClaims({ iss: "evil.example.com" })), CLIENT_ID)).toBeNull()
  })

  it("rejects an expired token", () => {
    const exp = Math.floor(Date.now() / 1000) - 60
    expect(sessionFromCredential(token(validClaims({ exp })), CLIENT_ID)).toBeNull()
  })

  it("falls back to a generic name when the profile has none", () => {
    const session = sessionFromCredential(token(validClaims({ name: undefined })), CLIENT_ID)
    expect(session?.user.name).toBe("Google user")
  })
})

describe("session storage", () => {
  it("persists and reloads a valid session", () => {
    const session = makeSession()
    saveSession(session)
    expect(loadSession(CLIENT_ID)?.user.id).toBe("1234567890")
  })

  it("drops a stored session whose token has expired", () => {
    const credential = token(validClaims({ exp: Math.floor(Date.now() / 1000) - 120 }))
    saveSession({
      credential,
      expiresAt: Date.now() - 120_000,
      user: { id: "1234567890", email: null, name: "Test User", picture: null },
    })
    expect(loadSession(CLIENT_ID)).toBeNull()
    expect(window.localStorage.getItem("software-factory.google-session")).toBeNull()
  })

  it("clears the session on demand", () => {
    saveSession(makeSession())
    clearSession()
    expect(window.localStorage.getItem("software-factory.google-session")).toBeNull()
  })
})

describe("isSessionValid", () => {
  it("accepts an unexpired session and rejects an expired one", () => {
    const session = makeSession()
    expect(isSessionValid(session)).toBe(true)
    expect(isSessionValid({ ...session, expiresAt: Date.now() - 60_000 })).toBe(false)
    expect(isSessionValid(null)).toBe(false)
  })
})

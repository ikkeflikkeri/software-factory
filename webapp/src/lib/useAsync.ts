import { useCallback, useEffect, useRef, useState } from "react"

export type AsyncState<T> =
  | { state: "loading"; data: null }
  | { state: "error"; data: null; error: Error; reload: () => void }
  | { state: "ready"; data: T; reload: () => void }

/**
 * Runs an async loader and exposes loading / error / ready states plus a
 * retry callback. The loader must be stable; pass dependencies via `deps`.
 */
/**
 * Timestamp for relative-time rendering, set after mount so render stays
 * pure and hydration is stable.
 */
export function useNow(): number {
  const [now, setNow] = useState(0)
  useEffect(() => {
    setNow(Date.now())
  }, [])
  return now
}

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let cancelled = false
    setError(null)
    if (nonce === 0) setData(null)
    loaderRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  if (error) return { state: "error", data: null, error, reload }
  if (data === null) return { state: "loading", data: null }
  return { state: "ready", data, reload }
}

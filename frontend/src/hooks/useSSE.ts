import { useEffect, useRef, useCallback } from 'react'

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001'

type EventHandler = (data: unknown) => void

interface SSEHook {
  on: (event: string, handler: EventHandler) => () => void
}

let _es: EventSource | null = null
const _handlers = new Map<string, Set<EventHandler>>()

function getOrCreateES(token: string | null): EventSource | null {
  if (!token || token === 'dev-no-auth') return null
  if (_es && _es.readyState !== EventSource.CLOSED) return _es

  _es = new EventSource(`${BASE}/api/sse`)

  _es.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data as string) as { type: string }
      const handlers = _handlers.get(msg.type)
      handlers?.forEach((h) => h(msg))
    } catch { /* ignore malformed */ }
  }

  // Handle named events from the server (event: ticket:created etc.)
  ;(['ticket:created', 'ticket:updated', 'ticket:voted'] as const).forEach((name) => {
    _es!.addEventListener(name, (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as MessageEvent).data as string) as unknown
        _handlers.get(name)?.forEach((h) => h(data))
      } catch { /* ignore */ }
    })
  })

  _es.onerror = () => {
    _es?.close()
    _es = null
    // EventSource reconnects automatically after error
  }

  return _es
}

export function useSSE(token: string | null): SSEHook {
  const tokenRef = useRef(token)
  tokenRef.current = token

  useEffect(() => {
    if (!token || token === 'dev-no-auth') return
    getOrCreateES(token)
    return () => {
      // Don't close on unmount — keep shared connection alive
    }
  }, [token])

  const on = useCallback((event: string, handler: EventHandler) => {
    if (!_handlers.has(event)) _handlers.set(event, new Set())
    _handlers.get(event)!.add(handler)
    return () => { _handlers.get(event)?.delete(handler) }
  }, [])

  return { on }
}

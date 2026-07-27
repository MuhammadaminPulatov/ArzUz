/**
 * Simple event bus for local report syncing when the server (SSE) is unavailable.
 * Create.tsx dispatches 'localReport' when a ticket is created offline,
 * and useReports listens for it to add the report to the feed.
 */
import type { Report } from '../types'

const EVENT_NAME = 'arzuz:local-report'

export function dispatchLocalReport(report: Report) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: report }))
}

export function onLocalReport(handler: (report: Report) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<Report>).detail)
  window.addEventListener(EVENT_NAME, listener)
  return () => window.removeEventListener(EVENT_NAME, listener)
}

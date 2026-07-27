import { useState, useEffect, useCallback } from 'react'
import type { Report } from '../types'
import { api } from '../lib/api'
import { onLocalReport } from '../lib/localEvents'
import { SAMPLE_REPORTS, CATEGORIES } from '../data/mock'

interface RawTicket {
  id?: string; ticketId?: string; userId?: string; username?: string; firstName?: string
  category?: string; categoryLabel?: string; title?: string; aiTitle?: string
  description?: string; aiDescription?: string; address?: string
  lat?: number; lng?: number; status?: string; votes?: number
  severity?: string; createdAt?: string
}

interface TicketsResponse { tickets: RawTicket[]; total: number }

export function normalizeTicket(t: RawTicket): Report {
  const cat = CATEGORIES.find(c => c.id === t.category) ?? CATEGORIES[CATEGORIES.length - 1]
  return {
    id:             t.id ?? t.ticketId ?? '',
    userId:         t.userId ?? '',
    username:       t.username ?? '',
    userAvatar:     (t.firstName ?? t.username ?? 'U').charAt(0).toUpperCase(),
    category:       t.categoryLabel ?? cat.label,
    categoryIcon:   cat.icon,
    categoryColor:  cat.color,
    title:          t.title ?? t.aiTitle ?? '',
    description:    t.description ?? t.aiDescription ?? '',
    address:        t.address ?? '',
    lat:            t.lat ?? 0,
    lng:            t.lng ?? 0,
    photoColor:     cat.bg,
    photoEmoji:     cat.icon,
    status:         (t.status as Report['status']) ?? 'new',
    votes:          t.votes ?? 0,
    hasVoted:       false,
    createdAt:      t.createdAt ?? '',
    aiSummary:      t.aiDescription ?? '',
    severity:       (t.severity as Report['severity']) ?? 'medium',
    supporterAvatars: [],
  }
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<TicketsResponse>('/tickets')
      .then(({ tickets }) => setReports(tickets.map(normalizeTicket)))
      .catch(() => {
        // Fallback to mock data when server is unavailable
        console.warn('[useReports] Server unavailable, using mock data')
        setReports(SAMPLE_REPORTS)
      })
      .finally(() => setLoading(false))
  }, [])

  // Listen for locally-created reports (when server/SSE is unavailable)
  useEffect(() => {
    return onLocalReport((report) => {
      setReports((prev) => [report, ...prev])
    })
  }, [])

  const addReport = useCallback((r: Report) => {
    setReports((prev) => [r, ...prev])
  }, [])

  const updateReport = useCallback((id: string, patch: Partial<Report>) => {
    setReports((prev) => prev.map((r) => (r.id === id || r.id === id ? { ...r, ...patch } : r)))
  }, [])

  return { reports, setReports, loading, addReport, updateReport }
}

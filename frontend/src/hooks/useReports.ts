import { useState, useEffect, useCallback } from 'react'
import type { Report } from '../types'
import { api } from '../lib/api'

interface TicketsResponse {
  tickets: Report[]
  total: number
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<TicketsResponse>('/tickets')
      .then(({ tickets }) => setReports(tickets))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [])

  const addReport = useCallback((r: Report) => {
    setReports((prev) => [r, ...prev])
  }, [])

  const updateReport = useCallback((id: string, patch: Partial<Report>) => {
    setReports((prev) => prev.map((r) => (r.id === id || r.id === id ? { ...r, ...patch } : r)))
  }, [])

  return { reports, setReports, loading, addReport, updateReport }
}

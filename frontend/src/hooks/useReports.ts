import { useState, useEffect } from 'react'
import type { Report } from '../types'
import { getReports } from '@backend/services/reports.service'

export function useReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReports().then((data) => {
      setReports(data)
      setLoading(false)
    })
  }, [])

  const updateReport = (id: string, patch: Partial<Report>) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return { reports, setReports, loading, updateReport }
}

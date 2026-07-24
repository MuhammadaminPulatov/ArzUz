import { useState, useEffect } from 'react'
import type { Report } from '../types'
import { voteReport } from '@backend/services/reports.service'

export function useVote(initialReports: Report[]) {
  const [reports, setReports] = useState<Report[]>(initialReports)

  useEffect(() => {
    if (initialReports.length > 0) setReports(initialReports)
  }, [initialReports])

  const handleVote = (id: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const next = { ...r, hasVoted: !r.hasVoted, votes: r.hasVoted ? r.votes - 1 : r.votes + 1 }
        voteReport(id, next.hasVoted) // fire-and-forget to real API
        return next
      })
    )
  }

  return { reports, handleVote }
}

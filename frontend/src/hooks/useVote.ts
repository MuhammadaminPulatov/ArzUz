import { useState } from 'react'
import type { Report } from '../types'

export function useVote(initialReports: Report[]) {
  const [reports, setReports] = useState<Report[]>(initialReports)

  const handleVote = (id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, hasVoted: !r.hasVoted, votes: r.hasVoted ? r.votes - 1 : r.votes + 1 }
          : r
      )
    )
  }

  return { reports, handleVote }
}

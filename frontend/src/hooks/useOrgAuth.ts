import { useState, useEffect } from 'react'

const ORG_TOKEN_KEY = 'org_token'
const ORG_INFO_KEY  = 'org_info'

export interface OrgInfo {
  orgId: string
  name: string
  shortName: string
  icon: string
  category: string
  district: string
  phone: string
}

export function useOrgAuth() {
  const [token, setToken]     = useState<string | null>(null)
  const [org,   setOrg]       = useState<OrgInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem(ORG_TOKEN_KEY)
    const o = localStorage.getItem(ORG_INFO_KEY)
    if (t && o) {
      setToken(t)
      try { setOrg(JSON.parse(o) as OrgInfo) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = (t: string, o: OrgInfo) => {
    localStorage.setItem(ORG_TOKEN_KEY, t)
    localStorage.setItem(ORG_INFO_KEY, JSON.stringify(o))
    setToken(t)
    setOrg(o)
  }

  const logout = () => {
    localStorage.removeItem(ORG_TOKEN_KEY)
    localStorage.removeItem(ORG_INFO_KEY)
    setToken(null)
    setOrg(null)
  }

  return { token, org, loading, login, logout }
}

import { useState, useEffect } from 'react'
import { api, setToken } from '../lib/api'

export interface TelegramUser {
  telegramId: string
  username: string
  firstName: string
  xp: number
  plan: 'free' | 'premium'
  isAdmin: boolean
}

let cachedToken: string | null = null
let cachedUser: TelegramUser | null = null

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(cachedToken)
  const [user, setUser] = useState<TelegramUser | null>(cachedUser)
  const [loading, setLoading] = useState(!cachedToken)

  useEffect(() => {
    if (cachedToken) return

    const tg = (window as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp
    const initData = tg?.initData ?? ''

    api.post<{ token: string; user: TelegramUser }>('/auth/telegram', { initData })
      .then(({ token: t, user: u }) => {
        cachedToken = t
        cachedUser = u
        setToken(t)
        setTokenState(t)
        setUser(u)
      })
      .catch(() => {
        // Dev fallback — no real Telegram context, continue without auth
        const devToken = 'dev-no-auth'
        cachedToken = devToken
        setTokenState(devToken)
      })
      .finally(() => setLoading(false))
  }, [])

  return { token, user, loading }
}

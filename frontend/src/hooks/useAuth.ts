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

interface TgWebAppUser {
  id?: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

function getTgUser(): TgWebAppUser | null {
  try {
    const tg = (window as any).Telegram?.WebApp
    return (tg?.initDataUnsafe?.user as TgWebAppUser) ?? null
  } catch {
    return null
  }
}

/** Returns Telegram first_name or fallback */
export function getTelegramUserName(): string {
  const tgUser = getTgUser()
  if (tgUser?.first_name) return tgUser.first_name
  return 'Foydalanuvchi'
}

/** Returns Telegram @username or empty string */
export function getTelegramUsername(): string {
  const tgUser = getTgUser()
  return tgUser?.username ?? ''
}

let cachedToken: string | null = null
let cachedUser: TelegramUser | null = null

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(cachedToken)
  const [user, setUser] = useState<TelegramUser | null>(cachedUser)
  const [loading, setLoading] = useState(!cachedToken)

  useEffect(() => {
    if (cachedToken) return

    const tg = (window as any).Telegram?.WebApp
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
        // Server unavailable — build user from Telegram WebApp context or use defaults
        const tgUser = getTgUser()
        const devToken = 'dev-no-auth'
        const fallbackUser: TelegramUser = {
          telegramId: tgUser?.id ? String(tgUser.id) : 'local-user',
          username: tgUser?.username ?? 'foydalanuvchi',
          firstName: tgUser?.first_name ?? 'Foydalanuvchi',
          xp: 850,
          plan: tgUser?.is_premium ? 'premium' : 'free',
          isAdmin: true,
        }
        cachedToken = devToken
        cachedUser = fallbackUser
        setToken(devToken)
        setTokenState(devToken)
        setUser(fallbackUser)
      })
      .finally(() => setLoading(false))
  }, [])

  return { token, user, loading }
}

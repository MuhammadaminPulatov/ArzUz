import type { Notification } from '@backend/types'

// Stub — real push notifications added in Phase 3 (Telegram Bot integration)
export function useNotifications() {
  const notifications: Notification[] = []
  const unread = 0
  const markAllRead = () => {}
  const markOneRead = (_id: string) => {}
  return { notifications, unread, markAllRead, markOneRead }
}

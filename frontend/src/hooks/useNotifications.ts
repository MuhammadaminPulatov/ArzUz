interface Notification { id: string; reportId: string; reportTitle: string; message: string; type: 'resolved' | 'in_progress' | 'comment'; read: boolean; createdAt: string }

// Stub — real push notifications added in Phase 3 (Telegram Bot integration)
export function useNotifications() {
  const notifications: Notification[] = []
  const unread = 0
  const markAllRead = () => {}
  const markOneRead = (_id: string) => {}
  return { notifications, unread, markAllRead, markOneRead }
}

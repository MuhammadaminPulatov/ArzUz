import type { Notification } from '../types'

const store: {
  items: Notification[]
  listeners: Set<() => void>
} = { items: [], listeners: new Set() }

export function subscribeNotifications(cb: () => void) {
  store.listeners.add(cb)
  return () => store.listeners.delete(cb)
}

export function getNotifications(): Notification[] {
  return store.items
}

export function addNotification(
  reportId: string,
  reportTitle: string,
  type: Notification['type']
): void {
  const messages: Record<Notification['type'], string> = {
    resolved:    `"${reportTitle}" muammosi muvaffaqiyatli hal etildi!`,
    in_progress: `"${reportTitle}" arizangiz ko'rib chiqilmoqda`,
    comment:     `"${reportTitle}" arizangizga yangi izoh qo'shildi`,
  }
  const n: Notification = {
    id: `notif-${Date.now()}`,
    reportId,
    reportTitle,
    message: messages[type],
    type,
    read: false,
    createdAt: new Date().toISOString(),
  }
  store.items = [n, ...store.items]
  store.listeners.forEach((cb) => cb())
}

export function markAllRead(): void {
  store.items = store.items.map((n) => ({ ...n, read: true }))
  store.listeners.forEach((cb) => cb())
}

export function markOneRead(id: string): void {
  store.items = store.items.map((n) => (n.id === id ? { ...n, read: true } : n))
  store.listeners.forEach((cb) => cb())
}

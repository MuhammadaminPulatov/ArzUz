import { useEffect, useRef } from 'react'

function getTg(): any {
  return (window as any).Telegram?.WebApp
}

export function useTelegramMainButton(text: string, onClick: () => void, enabled = true) {
  const cbRef = useRef(onClick)
  cbRef.current = onClick

  useEffect(() => {
    const tg = getTg()
    if (!tg?.MainButton) return

    const handler = () => cbRef.current()
    tg.MainButton.setText(text)
    tg.MainButton.onClick(handler)
    if (enabled) {
      tg.MainButton.enable()
      tg.MainButton.show()
    } else {
      tg.MainButton.disable()
      tg.MainButton.show()
    }

    return () => {
      tg.MainButton?.offClick(handler)
      tg.MainButton?.hide()
    }
  }, [text, enabled])
}

export function useTelegramBackButton(onClick: (() => void) | null) {
  const cbRef = useRef(onClick)
  cbRef.current = onClick

  useEffect(() => {
    const tg = getTg()
    if (!tg?.BackButton) return

    if (!onClick) {
      tg.BackButton.hide()
      return
    }

    const handler = () => cbRef.current?.()
    tg.BackButton.onClick(handler)
    tg.BackButton.show()

    return () => {
      tg.BackButton?.offClick(handler)
      tg.BackButton?.hide()
    }
  }, [!!onClick])
}

export function haptic(type: 'tap' | 'success' | 'error' | 'warning' | 'select' = 'tap') {
  const fb = getTg()?.HapticFeedback
  if (!fb) return
  if (type === 'tap')     fb.impactOccurred('light')
  if (type === 'select')  fb.selectionChanged()
  if (type === 'success') fb.notificationOccurred('success')
  if (type === 'error')   fb.notificationOccurred('error')
  if (type === 'warning') fb.notificationOccurred('warning')
}

export function isTelegramWebApp(): boolean {
  return !!getTg()?.initData
}

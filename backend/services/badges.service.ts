import type { Badge } from '../types'
import { BADGES } from '../mock/badges'

export async function getBadges(): Promise<Badge[]> {
  return BADGES
}

export async function awardBadge(_userId: string, _badgeId: string): Promise<void> {
  // Real API call bu yerga qo'shiladi
}

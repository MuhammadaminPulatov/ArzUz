import type { Report, Category } from '../types'
import { SAMPLE_REPORTS, CATEGORIES } from '../mock/reports'

export async function getReports(): Promise<Report[]> {
  return SAMPLE_REPORTS
}

export async function getCategories(): Promise<Category[]> {
  return CATEGORIES
}

export async function createReport(
  data: Omit<Report, 'id' | 'votes' | 'hasVoted' | 'createdAt' | 'supporterAvatars'>
): Promise<Report> {
  return {
    ...data,
    id: `ARZ-${1000 + Math.floor(Math.random() * 9000)}`,
    votes: 0,
    hasVoted: false,
    createdAt: 'Hozir',
    supporterAvatars: [],
  }
}

export async function voteReport(_id: string, _hasVoted: boolean): Promise<void> {
  // Real API call bu yerga qo'shiladi
}

import type { Analytics, ApiResponse } from '../types'
import { MOCK_ANALYTICS } from '../mock/analytics'
import { SAMPLE_REPORTS } from '../mock/reports'

export async function getAnalytics(): Promise<ApiResponse<Analytics>> {
  // Real API: GET /api/admin/analytics
  await new Promise((r) => setTimeout(r, 400)) // simulate network
  return { ok: true, data: MOCK_ANALYTICS }
}

export async function getAdminReports(): Promise<ApiResponse<typeof SAMPLE_REPORTS>> {
  // Real API: GET /api/admin/reports?page=1&limit=20
  await new Promise((r) => setTimeout(r, 300))
  return { ok: true, data: SAMPLE_REPORTS }
}

export async function updateReportStatus(
  id: string,
  status: 'sent' | 'in_progress' | 'resolved'
): Promise<ApiResponse<void>> {
  // Real API: PATCH /api/admin/reports/:id { status }
  await new Promise((r) => setTimeout(r, 200))
  console.log(`[API] PATCH /reports/${id} → status: ${status}`)
  return { ok: true, data: undefined }
}

export async function deleteReport(id: string): Promise<ApiResponse<void>> {
  // Real API: DELETE /api/admin/reports/:id
  await new Promise((r) => setTimeout(r, 200))
  console.log(`[API] DELETE /reports/${id}`)
  return { ok: true, data: undefined }
}

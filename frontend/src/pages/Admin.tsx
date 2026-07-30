import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminLayout, { type AdminSection } from '../components/admin/AdminLayout'
import AdminDashboard, { type AdminAnalytics as DashboardAnalytics } from '../components/admin/AdminDashboard'
import AdminReports from '../components/admin/AdminReports'
import AdminOrganizations from '../components/admin/AdminOrganizations'
import AdminUsers from '../components/admin/AdminUsers'
import AdminAnalyticsSection from '../components/admin/AdminAnalytics'
import DistrictMap from '../components/DistrictMap'
import { api } from '../lib/api'
import { normalizeTicket, type RawTicket } from '../hooks/useReports'
import type { Report } from '../types'
import { type MockOrganization } from '../data/organizations'

interface AdminProps { onBack: () => void }

export default function Admin({ onBack }: AdminProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api.get<DashboardAnalytics>('/admin/analytics').catch(() => null),
      api.get<{ tickets: RawTicket[]; total: number }>('/admin/tickets').catch(() => null),
    ]).then(([aData, rData]) => {
      setAnalytics(aData ?? { total: 0, byStatus: {}, avgResolutionDays: 0 })
      setReports((rData?.tickets ?? []).map(normalizeTicket))
      setLoading(false)
    })
  }

  useEffect(() => { loadData() }, [])

  const handleStatusChange = async (id: string, status: Report['status']) => {
    setUpdatingId(id)
    await api.patch(`/admin/tickets/${id}`, { status }).catch(() => null)
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setUpdatingId(null)
  }

  const handleAssign = async (id: string, org: MockOrganization) => {
    setUpdatingId(id)
    await api.patch(`/admin/tickets/${id}`, { assignedOrgId: org.id, assignedOrgName: org.name, status: 'in_progress' }).catch(() => null)
    setReports(prev => prev.map(r => r.id === id ? { ...r, assignedOrgName: org.name, status: 'in_progress' } : r))
    setUpdatingId(null)
  }

  const fallbackAnalytics: DashboardAnalytics = analytics ?? { total: 0, byStatus: {}, avgResolutionDays: 0 }

  return (
    <AdminLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onBack={onBack}
      onRefresh={loadData}
      loading={loading}
    >
      <AnimatePresence mode="wait">
        {activeSection === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div style={{ width: 28, height: 28, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : (
              <AdminDashboard analytics={fallbackAnalytics} reports={reports} />
            )}
          </motion.div>
        )}

        {activeSection === 'reports' && (
          <motion.div key="reports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AdminReports reports={reports} onStatusChange={handleStatusChange} onAssign={handleAssign} updatingId={updatingId} />
          </motion.div>
        )}

        {activeSection === 'organizations' && (
          <motion.div key="organizations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AdminOrganizations />
          </motion.div>
        )}

        {activeSection === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AdminUsers />
          </motion.div>
        )}

        {activeSection === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AdminAnalyticsSection reports={reports} avgResolutionDays={fallbackAnalytics.avgResolutionDays} />
          </motion.div>
        )}

        {activeSection === 'map' && (
          <motion.div key="map" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 pb-8 pt-1 flex flex-col gap-3">
            <div>
              <p className="text-[15px] font-black" style={{ color: '#0F172A' }}>Toshkent tumanlari xaritasi</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Muammolar soni va taqsimoti</p>
            </div>
            <DistrictMap />
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}

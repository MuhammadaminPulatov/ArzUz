import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Users, Building2, BarChart2, ChevronRight,
  CheckCircle2, Clock, AlertCircle, Zap, Plus, Trash2,
  Crown, FileText, TrendingUp,
} from 'lucide-react'
import { api } from '../lib/api'

interface SuperStats {
  totalTickets: number
  totalUsers: number
  totalOrgs: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  avgResolutionDays: number
  resolved: number
  inProgress: number
  pending: number
}

interface OrgStat {
  orgId: string
  name: string
  shortName: string
  icon: string
  category: string
  district: string
  username: string
  totalAssigned: number
  resolved: number
  inProgress: number
}

interface AdminEntry {
  telegramId: string
  firstName: string
  username: string
  xp: number
  reportCount: number
  lastActiveAt: string | null
  isSuperAdmin: boolean
}

type Section = 'stats' | 'orgs' | 'admins'

interface Props { onBack: () => void }

const SECTION_TABS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'stats',  label: 'Statistika',  icon: BarChart2  },
  { id: 'orgs',   label: 'Tashkilotlar', icon: Building2 },
  { id: 'admins', label: 'Adminlar',     icon: Shield    },
]

const EMPTY_NEW_ORG = { name: '', shortName: '', icon: '🏛', category: '', district: 'Barcha tumanlar', phone: '', username: '', password: '' }

export default function SuperAdmin({ onBack }: Props) {
  const [section, setSection] = useState<Section>('stats')
  const [stats,   setStats]   = useState<SuperStats | null>(null)
  const [orgs,    setOrgs]    = useState<OrgStat[]>([])
  const [admins,  setAdmins]  = useState<AdminEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddOrg, setShowAddOrg] = useState(false)
  const [newOrg, setNewOrg]         = useState({ ...EMPTY_NEW_ORG })
  const [saving,   setSaving]       = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, o, a] = await Promise.all([
        api.get<SuperStats>('/superadmin/stats'),
        api.get<OrgStat[]>('/superadmin/organizations'),
        api.get<AdminEntry[]>('/superadmin/admins'),
      ])
      setStats(s)
      setOrgs(o)
      setAdmins(a)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/superadmin/organizations', newOrg)
      setShowAddOrg(false)
      setNewOrg({ ...EMPTY_NEW_ORG })
      await loadAll()
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrg = async (orgId: string) => {
    setDeleting(orgId)
    try {
      await api.del(`/superadmin/organizations/${orgId}`)
      setOrgs(prev => prev.filter(o => o.orgId !== orgId))
    } catch { /* silent */ } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F0F4FF' }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0"
        style={{ background: 'linear-gradient(150deg, #0F172A 0%, #1E293B 60%, #334155 100%)' }}>
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ChevronRight size={16} className="text-white" style={{ transform: 'rotate(180deg)' }} />
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.25)' }}>
              <Crown size={16} style={{ color: '#FCD34D' }} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[16px] font-black text-white leading-tight">Super Admin</h1>
              <p className="text-[10px]" style={{ color: '#94A3B8' }}>Tizim boshqaruvi</p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Arizalar',       value: stats.totalTickets, icon: FileText,  color: '#60A5FA' },
              { label: 'Foydalanuvchilar', value: stats.totalUsers, icon: Users,     color: '#34D399' },
              { label: 'Tashkilotlar',   value: stats.totalOrgs,    icon: Building2, color: '#FCD34D' },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <Icon size={14} strokeWidth={2} style={{ color: s.color }} className="mx-auto mb-1" />
                  <p className="text-[18px] font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[9px]" style={{ color: '#94A3B8' }}>{s.label}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5">
          {SECTION_TABS.map(tab => {
            const Icon = tab.icon
            const active = section === tab.id
            return (
              <motion.button key={tab.id} whileTap={{ scale: 0.93 }}
                onClick={() => setSection(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-bold flex-1 justify-center"
                style={{
                  background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#fff' : '#64748B',
                  border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                }}>
                <Icon size={13} strokeWidth={2.2} />
                {tab.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div style={{ width: 28, height: 28, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* STATS */}
            {section === 'stats' && stats && (
              <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Hal etildi', value: `${stats.totalTickets > 0 ? Math.round((stats.resolved / stats.totalTickets) * 100) : 0}%`, sub: `${stats.resolved} ta ariza`, icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Jarayonda',  value: stats.inProgress,  sub: 'Ishlanmoqda',    icon: Clock,       color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  },
                    { label: 'Kutilmoqda', value: stats.pending,     sub: 'Javob kutmoqda', icon: AlertCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
                    { label: "O'rt. hal",  value: `${stats.avgResolutionDays}k`, sub: 'Kun', icon: TrendingUp, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'  },
                  ].map(kpi => {
                    const Icon = kpi.icon
                    return (
                      <div key={kpi.label} className="rounded-2xl p-3.5"
                        style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 10px rgba(15,23,42,0.06)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5"
                          style={{ background: kpi.bg }}>
                          <Icon size={15} style={{ color: kpi.color }} strokeWidth={2} />
                        </div>
                        <p className="text-[20px] font-black" style={{ color: '#0F172A' }}>{kpi.value}</p>
                        <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#64748B' }}>{kpi.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#94A3B8' }}>{kpi.sub}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-2xl p-4"
                  style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 10px rgba(15,23,42,0.06)' }}>
                  <p className="text-[13.5px] font-black mb-3" style={{ color: '#0F172A' }}>Kategoriyalar bo'yicha</p>
                  {Object.entries(stats.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => {
                      const pct = stats.totalTickets > 0 ? Math.round((count / stats.totalTickets) * 100) : 0
                      return (
                        <div key={cat} className="flex items-center gap-3 mb-2.5">
                          <span className="text-[12px] w-20 truncate" style={{ color: '#475569' }}>{cat}</span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#3B82F6' }} />
                          </div>
                          <span className="text-[12px] font-bold w-8 text-right" style={{ color: '#0F172A' }}>{count}</span>
                        </div>
                      )
                    })}
                </div>
              </motion.div>
            )}

            {/* ORGS */}
            {section === 'orgs' && (
              <motion.div key="orgs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">

                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAddOrg(true)}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                  <Plus size={16} strokeWidth={2.5} />
                  Yangi tashkilot qo'shish
                </motion.button>

                {orgs.map((org, i) => {
                  const resolvedPct = org.totalAssigned > 0 ? Math.round((org.resolved / org.totalAssigned) * 100) : 0
                  return (
                    <motion.div key={org.orgId}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="rounded-2xl p-4"
                      style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: 'rgba(59,130,246,0.08)' }}>
                          {org.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-bold truncate" style={{ color: '#0F172A' }}>{org.name}</p>
                            <motion.button whileTap={{ scale: 0.88 }}
                              disabled={deleting === org.orgId}
                              onClick={() => handleDeleteOrg(org.orgId)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ml-2"
                              style={{ background: 'rgba(239,68,68,0.08)', opacity: deleting === org.orgId ? 0.4 : 1 }}>
                              <Trash2 size={13} style={{ color: '#EF4444' }} strokeWidth={2} />
                            </motion.button>
                          </div>
                          <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
                            {org.category} · @{org.username}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[
                          { label: 'Jami',      value: org.totalAssigned, color: '#3B82F6' },
                          { label: 'Jarayonda', value: org.inProgress,    color: '#F59E0B' },
                          { label: 'Hal etildi', value: org.resolved,     color: '#10B981' },
                        ].map(s => (
                          <div key={s.label} className="rounded-xl p-2 text-center"
                            style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(226,232,240,0.6)' }}>
                            <p className="text-[15px] font-black" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px]" style={{ color: '#94A3B8' }}>{s.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10.5px]" style={{ color: '#94A3B8' }}>Hal etish darajasi</span>
                          <span className="text-[10.5px] font-bold" style={{ color: '#10B981' }}>{resolvedPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,0.1)' }}>
                          <div className="h-full rounded-full" style={{ width: `${resolvedPct}%`, background: '#10B981' }} />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}

            {/* ADMINS */}
            {section === 'admins' && (
              <motion.div key="admins" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                <p className="text-[11px]" style={{ color: '#94A3B8' }}>{admins.length} ta admin ro'yxatda</p>
                {admins.map((a, i) => (
                  <motion.div key={a.telegramId}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-black text-white shrink-0"
                      style={{ background: a.isSuperAdmin ? 'linear-gradient(135deg, #F59E0B, #EF4444)' : 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
                      {a.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>{a.firstName}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            background: a.isSuperAdmin ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.1)',
                            color:      a.isSuperAdmin ? '#92400E' : '#1D4ED8',
                          }}>
                          {a.isSuperAdmin ? 'Super Admin' : 'Admin'}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
                        {a.username !== '—' ? `@${a.username}` : a.telegramId} · {a.reportCount} ta ariza
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Zap size={11} style={{ color: '#6366F1' }} strokeWidth={2.5} />
                        <span className="text-[13px] font-black" style={{ color: '#0F172A' }}>{a.xp}</span>
                      </div>
                      <p className="text-[9px]" style={{ color: '#94A3B8' }}>XP</p>
                    </div>
                  </motion.div>
                ))}

                {admins.length === 0 && (
                  <div className="text-center py-16">
                    <Shield size={40} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} strokeWidth={1.5} />
                    <p className="text-[13px]" style={{ color: '#94A3B8' }}>Admin topilmadi</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* Add org bottom sheet */}
      <AnimatePresence>
        {showAddOrg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowAddOrg(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="w-full rounded-t-3xl p-6 flex flex-col gap-3"
              style={{ background: '#fff', maxHeight: '85vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <p className="text-[16px] font-black" style={{ color: '#0F172A' }}>Yangi tashkilot</p>
              <form onSubmit={handleAddOrg} className="flex flex-col gap-3">
                {[
                  { key: 'name',      label: "To'liq nomi",  placeholder: "Toshkent kommunal xizmatlari" },
                  { key: 'shortName', label: 'Qisqa nomi',   placeholder: 'Kommunal' },
                  { key: 'icon',      label: 'Emoji',        placeholder: '🏛' },
                  { key: 'category',  label: 'Kategoriya',   placeholder: "Suv muammosi" },
                  { key: 'district',  label: 'Tuman',        placeholder: 'Barcha tumanlar' },
                  { key: 'phone',     label: 'Telefon',      placeholder: '+998 71 123-45-67' },
                  { key: 'username',  label: 'Login',        placeholder: 'kommunal' },
                  { key: 'password',  label: 'Parol',        placeholder: '••••••••' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11.5px] font-bold mb-1 block" style={{ color: '#475569' }}>{f.label}</label>
                    <input
                      type={f.key === 'password' ? 'password' : 'text'}
                      value={newOrg[f.key as keyof typeof newOrg]}
                      onChange={e => setNewOrg(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      required={['name', 'shortName', 'category', 'district', 'username', 'password'].includes(f.key)}
                      className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                      style={{ background: 'rgba(241,245,249,0.9)', border: '1.5px solid rgba(226,232,240,0.9)', color: '#0F172A' }}
                    />
                  </div>
                ))}
                <div className="flex gap-3 mt-1">
                  <motion.button type="button" whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddOrg(false)}
                    className="flex-1 py-3 rounded-2xl text-[13px] font-bold"
                    style={{ background: 'rgba(241,245,249,0.9)', color: '#64748B' }}>
                    Bekor qilish
                  </motion.button>
                  <motion.button type="submit" whileTap={{ scale: 0.95 }}
                    disabled={saving}
                    className="flex-1 py-3 rounded-2xl text-[13px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

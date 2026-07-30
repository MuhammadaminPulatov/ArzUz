import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown } from 'lucide-react'
import { api } from '../../lib/api'

interface LeaderboardUser {
  telegramId: string
  firstName: string
  username?: string
  reportCount: number
  xp: number
}

type SortKey = 'xp' | 'reportCount'

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1']

function getLevel(reportCount: number) {
  if (reportCount > 20) return { label: 'Ekspert',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' }
  if (reportCount >= 5) return { label: 'Faol',     color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  }
  return                       { label: 'Yangi',    color: '#10B981', bg: 'rgba(16,185,129,0.1)'  }
}

export default function AdminUsers() {
  const [users, setUsers]     = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('xp')

  useEffect(() => {
    api.get<LeaderboardUser[]>('/auth/leaderboard')
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const list = users.filter(u =>
      !q || u.firstName.toLowerCase().includes(q) || (u.username ?? '').toLowerCase().includes(q)
    )
    return [...list].sort((a, b) => b[sortBy] - a[sortBy])
  }, [users, search, sortBy])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div style={{ width: 28, height: 28, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div className="px-4 pb-8 pt-1 flex flex-col gap-3">
      <div>
        <p className="text-[15px] font-black" style={{ color: '#0F172A' }}>Foydalanuvchilar</p>
        <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>{users.length} ta ro'yxatdan o'tgan</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism yoki username..."
            className="w-full pl-8 pr-3 py-2.5 rounded-xl text-[12.5px] outline-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#0F172A', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }} />
        </div>
        <div className="relative">
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
            className="appearance-none pl-3 pr-7 py-2.5 rounded-xl text-[12px] font-semibold outline-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#475569', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
            <option value="xp">XP bo'yicha</option>
            <option value="reportCount">Ariza bo'yicha</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(226,232,240,0.8)', background: 'rgba(248,250,252,0.8)' }}>
              {['#', 'Foydalanuvchi', 'Ariza', 'XP', 'Daraja'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold" style={{ color: '#64748B' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const level = getLevel(u.reportCount)
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length]!
              return (
                <tr key={u.telegramId}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(226,232,240,0.5)' : 'none' }}>
                  <td className="px-4 py-3 text-[12px]" style={{ color: '#94A3B8' }}>{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black text-white shrink-0"
                        style={{ background: color }}>
                        {u.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: '#0F172A' }}>{u.firstName}</p>
                        {u.username && <p className="text-[11px]" style={{ color: '#94A3B8' }}>@{u.username}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold" style={{ color: '#0F172A' }}>{u.reportCount}</td>
                  <td className="px-4 py-3 text-[13px] font-bold" style={{ color: '#6366F1' }}>{u.xp}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: level.bg, color: level.color }}>{level.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-12 text-[13px]" style={{ color: '#94A3B8' }}>Foydalanuvchi topilmadi</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-2">
        {filtered.map((u, i) => {
          const level = getLevel(u.reportCount)
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length]!
          return (
            <motion.div key={u.telegramId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3.5 rounded-2xl"
              style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-black text-white shrink-0"
                style={{ background: color }}>
                {u.firstName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: '#0F172A' }}>{u.firstName}</p>
                {u.username && <p className="text-[11px]" style={{ color: '#94A3B8' }}>@{u.username}</p>}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: level.bg, color: level.color }}>{level.label}</span>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: '#94A3B8' }}>
                  <span>{u.reportCount} ariza</span>
                  <span>·</span>
                  <span style={{ color: '#6366F1', fontWeight: 700 }}>{u.xp} XP</span>
                </div>
              </div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center py-12 text-[13px]" style={{ color: '#94A3B8' }}>Foydalanuvchi topilmadi</p>
        )}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../lib/api'

interface DistrictStat {
  district: string
  total: number
  byCategory: Record<string, number>
  dominant: string
  dominantColor: string
}

const DISTRICT_COORDS: Record<string, [number, number]> = {
  'Yunusobod tumani':       [41.335, 69.290],
  "Mirzo Ulug'bek tumani":  [41.311, 69.278],
  'Chilonzor tumani':       [41.281, 69.207],
  'Yakkasaroy tumani':      [41.278, 69.245],
  'Shayxontohur tumani':    [41.322, 69.242],
  'Olmazor tumani':         [41.340, 69.220],
  'Bektemir tumani':        [41.242, 69.282],
  'Sergeli tumani':         [41.252, 69.234],
  'Uchtepa tumani':         [41.287, 69.212],
  'Yashnobod tumani':       [41.302, 69.315],
  'Mirobod tumani':         [41.297, 69.265],
}

const CATEGORY_LABELS: Record<string, string> = {
  road:     "Yo'l",
  light:    'Chiroq',
  water:    'Suv',
  electric: 'Elektr',
  trash:    'Axlat',
  tree:     'Daraxt',
  building: 'Bino',
  other:    'Boshqa',
}

function radiusFor(total: number) {
  return Math.max(16, Math.min(46, 10 + Math.sqrt(total) * 6))
}

function pct(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

export default function DistrictMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const [districts, setDistricts] = useState<DistrictStat[]>([])

  useEffect(() => {
    api.get<DistrictStat[]>('/admin/districts').then(setDistricts).catch(() => {})
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current || districts.length === 0) return

    const map = L.map(containerRef.current, {
      center: [41.299, 69.24],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    districts.forEach((d) => {
      const coords = DISTRICT_COORDS[d.district]
      if (!coords) return
      const radius = radiusFor(d.total)

      const circle = L.circleMarker(coords, {
        radius,
        fillColor: d.dominantColor,
        fillOpacity: 0.75,
        color: '#fff',
        weight: 2.5,
      }).addTo(map)

      const categoryRows = Object.entries(d.byCategory)
        .sort(([, a], [, b]) => b - a)
        .map(([key, count]) => {
          const p = pct(count, d.total)
          return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:2px 0">
            <span style="color:#475569;font-size:11px">${CATEGORY_LABELS[key] ?? key}</span>
            <div style="display:flex;align-items:center;gap:6px">
              <div style="height:4px;border-radius:999px;background:${d.dominantColor};width:${Math.max(18, p * 0.8)}px;opacity:0.85"></div>
              <span style="font-size:11px;font-weight:700;color:#0F172A">${count}</span>
            </div>
          </div>`
        }).join('')

      const popup = L.popup({
        closeButton: false,
        className: 'district-popup',
        offset: [0, -radius],
        minWidth: 190,
      }).setContent(`
        <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:4px 0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="font-size:13px;font-weight:800;color:#0F172A">${d.district}</div>
            <div style="background:${d.dominantColor};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:8px">${d.total} ta</div>
          </div>
          ${categoryRows}
        </div>
      `)

      circle.bindPopup(popup)
      circle.on('mouseover', () => circle.openPopup())
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [districts])

  const maxTotal = Math.max(...districts.map((x) => x.total), 1)

  return (
    <div className="flex flex-col gap-3">
      {districts.length === 0 && (
        <div className="rounded-2xl flex items-center justify-center"
          style={{ height: 360, background: '#fff', border: '1px solid rgba(226,232,240,0.8)' }}>
          <p className="text-[13px]" style={{ color: '#94A3B8' }}>Ma'lumot yuklanmoqda...</p>
        </div>
      )}
      {districts.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ height: 360, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        </div>
      )}

      <div className="rounded-2xl p-4"
        style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
        <p className="text-[12px] font-bold mb-3" style={{ color: '#64748B' }}>ASOSIY KATEGORIYA</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Yo'l",    color: '#EF4444' },
            { label: 'Chiroq', color: '#F59E0B' },
            { label: 'Suv',    color: '#3B82F6' },
            { label: 'Axlat',  color: '#10B981' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[11.5px] font-semibold" style={{ color: '#475569' }}>{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-3" style={{ color: '#94A3B8' }}>
          Doira o'lchami tumandagi muammolar soniga proporsional. Sichqonchani olib boring — batafsil ko'ring.
        </p>
      </div>

      {districts.length > 0 && (
        <div className="rounded-2xl p-4"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
          <p className="text-[13.5px] font-black mb-3" style={{ color: '#0F172A' }}>Muammo reytingi</p>
          {districts.map((d, i) => {
            const barW = Math.round((d.total / maxTotal) * 100)
            return (
              <div key={d.district} className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold w-4 text-right shrink-0"
                  style={{ color: i < 3 ? d.dominantColor : '#94A3B8' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] font-semibold" style={{ color: '#0F172A' }}>{d.district}</span>
                    <span className="text-[11px] font-bold" style={{ color: d.dominantColor }}>{d.total} ta</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${barW}%`, background: d.dominantColor, opacity: 0.8 }} />
                  </div>
                </div>
              </div>
            )
          })}
          {districts.length === 0 && (
            <p className="text-[12px] text-center py-4" style={{ color: '#94A3B8' }}>Hali ariza yo'q</p>
          )}
        </div>
      )}
    </div>
  )
}

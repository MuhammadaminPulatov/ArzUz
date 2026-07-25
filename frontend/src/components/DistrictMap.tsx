import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
const TOSHKENT_DISTRICTS = [
  { id: 'yunusobod',      name: 'Yunusobod',       lat: 41.3350, lng: 69.2900, total: 18, byCategory: { road: 8, light: 4, water: 2, garbage: 3, other: 1 },  dominant: 'road',  dominantColor: '#EF4444' },
  { id: 'mirzo-ulugbek',  name: "Mirzo Ulug'bek",  lat: 41.3110, lng: 69.2780, total: 14, byCategory: { road: 5, light: 3, water: 4, garbage: 2 },            dominant: 'road',  dominantColor: '#EF4444' },
  { id: 'chilonzor',      name: 'Chilonzor',        lat: 41.2810, lng: 69.2070, total: 22, byCategory: { road: 6, light: 7, water: 3, garbage: 5, other: 1 },  dominant: 'light', dominantColor: '#F59E0B' },
  { id: 'yakkasaroy',     name: 'Yakkasaroy',       lat: 41.2780, lng: 69.2450, total: 9,  byCategory: { road: 3, light: 2, water: 3, garbage: 1 },            dominant: 'road',  dominantColor: '#EF4444' },
  { id: 'shayxontohur',   name: 'Shayxontohur',     lat: 41.3220, lng: 69.2420, total: 16, byCategory: { road: 4, light: 3, water: 6, garbage: 3 },            dominant: 'water', dominantColor: '#3B82F6' },
  { id: 'almazar',        name: 'Olmazor',           lat: 41.3400, lng: 69.2200, total: 11, byCategory: { road: 5, light: 2, water: 2, garbage: 2 },            dominant: 'road',  dominantColor: '#EF4444' },
  { id: 'bektemir',       name: 'Bektemir',          lat: 41.2420, lng: 69.2820, total: 7,  byCategory: { road: 3, light: 1, water: 2, garbage: 1 },            dominant: 'road',  dominantColor: '#EF4444' },
  { id: 'sergeli',        name: 'Sergeli',            lat: 41.2520, lng: 69.2340, total: 13, byCategory: { road: 4, light: 5, water: 2, garbage: 2 },           dominant: 'light', dominantColor: '#F59E0B' },
  { id: 'uchtepa',        name: 'Uchtepa',            lat: 41.2870, lng: 69.2120, total: 10, byCategory: { road: 3, light: 2, water: 4, garbage: 1 },           dominant: 'water', dominantColor: '#3B82F6' },
  { id: 'yashnobod',      name: 'Yashnobod',          lat: 41.3020, lng: 69.3150, total: 8,  byCategory: { road: 3, light: 2, water: 1, garbage: 2 },           dominant: 'road',  dominantColor: '#EF4444' },
  { id: 'lagan',          name: 'Mirobod',             lat: 41.2970, lng: 69.2650, total: 15, byCategory: { road: 5, light: 4, water: 3, garbage: 3 },          dominant: 'road',  dominantColor: '#EF4444' },
]

const CATEGORY_LABELS: Record<string, string> = {
  road:    "Yo'l",
  light:   'Chiroq',
  water:   'Suv',
  garbage: 'Axlat',
  other:   'Boshqa',
}

function radiusFor(total: number) {
  return Math.max(16, Math.min(46, 10 + Math.sqrt(total) * 6))
}

function pct(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

export default function DistrictMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

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

    TOSHKENT_DISTRICTS.forEach((d) => {
      const radius = radiusFor(d.total)

      const circle = L.circleMarker([d.lat, d.lng], {
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
            <div style="font-size:13px;font-weight:800;color:#0F172A">${d.name}</div>
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
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl overflow-hidden" style={{ height: 360, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Legend */}
      <div
        className="rounded-2xl p-4"
        style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
      >
        <p className="text-[12px] font-bold mb-3" style={{ color: '#64748B' }}>ASOSIY KATEGORIYA</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Yo'l", color: '#EF4444' },
            { label: 'Chiroq', color: '#F59E0B' },
            { label: 'Suv', color: '#3B82F6' },
            { label: 'Axlat', color: '#10B981' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[11.5px] font-semibold" style={{ color: '#475569' }}>{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-3" style={{ color: '#94A3B8' }}>
          Doira o'lchami tumandagi muammolar soniga proporsional. Sichqonchani olib boring — batafsil ko'ring.
        </p>
      </div>

      {/* District ranking */}
      <div
        className="rounded-2xl p-4"
        style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
      >
        <p className="text-[13.5px] font-black mb-3" style={{ color: '#0F172A' }}>Muammo reytingi</p>
        {[...TOSHKENT_DISTRICTS]
          .sort((a, b) => b.total - a.total)
          .map((d, i) => {
            const maxTotal = Math.max(...TOSHKENT_DISTRICTS.map((x) => x.total))
            const barW = Math.round((d.total / maxTotal) * 100)
            return (
              <div key={d.id} className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold w-4 text-right shrink-0" style={{ color: i < 3 ? d.dominantColor : '#94A3B8' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] font-semibold" style={{ color: '#0F172A' }}>{d.name}</span>
                    <span className="text-[11px] font-bold" style={{ color: d.dominantColor }}>{d.total} ta</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${barW}%`, background: d.dominantColor, opacity: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

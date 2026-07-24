import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { MapPin, Navigation } from 'lucide-react'
import { motion } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const customIcon = L.divIcon({
  html: `<div style="
    width:32px;height:40px;
    display:flex;align-items:flex-end;justify-content:center;
    filter:drop-shadow(0 4px 8px rgba(59,130,246,0.4));
  ">
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
      <ellipse cx="16" cy="37" rx="6" ry="2.5" fill="rgba(59,130,246,0.18)"/>
      <path d="M16 2C9.37 2 4 7.37 4 14c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="#3B82F6"/>
      <circle cx="16" cy="14" r="5" fill="white"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
})

interface LatLng { lat: number; lng: number }

function DraggableMarker({ position, onChange }: { position: LatLng; onChange: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return <Marker position={[position.lat, position.lng]} icon={customIcon} />
}

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void
}

export default function MapPicker({ onLocationSelect }: MapPickerProps) {
  const [position, setPosition] = useState<LatLng>({ lat: 41.2995, lng: 69.2401 })
  const [address, setAddress] = useState('Toshkent sh., Chorsu bozori atrofi')
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    onLocationSelect(position.lat, position.lng, address)
  }, [position, address])

  const handleGPS = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setPosition({ lat, lng })
        setAddress('Aniq joylashuv aniqlandi')
        onLocationSelect(lat, lng, 'Aniq joylashuv aniqlandi')
        setLocating(false)
      },
      () => {
        setLocating(false)
      },
      { timeout: 8000 }
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-2xl overflow-hidden" style={{ height: '180px' }}>
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution=""
          />
          <DraggableMarker
            position={position}
            onChange={(p) => {
              setPosition(p)
              setAddress(`${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`)
            }}
          />
        </MapContainer>
        <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-black/5" />
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px]"
          style={{ background: 'var(--tg-theme-secondary-bg-color, #F1F5F9)' }}
        >
          <MapPin size={14} className="text-blue-500 shrink-0" strokeWidth={2.5} />
          <span className="truncate" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
            {address}
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleGPS}
          disabled={locating}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-medium bg-blue-500 text-white shrink-0 disabled:opacity-60 transition-opacity"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          {locating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Navigation size={14} strokeWidth={2.5} />
          )}
          {!locating && <span className="hidden xs:inline">GPS</span>}
        </motion.button>
      </div>
    </div>
  )
}

import { useState } from 'react'

interface LatLng {
  lat: number
  lng: number
}

export function useGPS(defaultPos: LatLng = { lat: 41.2995, lng: 69.2401 }) {
  const [pos, setPos] = useState<LatLng>(defaultPos)
  const [address, setAddress] = useState('Toshkent sh., Chorsu bozori atrofi')
  const [locating, setLocating] = useState(false)

  const handleGPS = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setPos({ lat, lng })
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  return { pos, address, locating, handleGPS, setPos, setAddress }
}

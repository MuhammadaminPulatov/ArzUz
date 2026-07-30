import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, RotateCcw, MapPin, Mic, MicOff, FileText,
  CheckCircle2, Send, ChevronLeft, AlertCircle, Loader2,
  Tag, Lightbulb, Image as ImageIcon, Edit3, Sparkles,
  Building2, Zap, Brain,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CATEGORIES } from '../data/mock'
import { useGPS } from '../hooks/useGPS'
import { useVoiceTranscription } from '../hooks/useVoiceTranscription'
import { api } from '../lib/api'
import { dispatchLocalReport } from '../lib/localEvents'
import { getTelegramUserName } from '../hooks/useAuth'
import { useTelegramMainButton, useTelegramBackButton, haptic } from '../hooks/useTelegramUI'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const pinIcon = L.divIcon({
  html: `<div style="filter:drop-shadow(0 4px 8px rgba(59,130,246,0.5))">
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
      <ellipse cx="14" cy="33" rx="5" ry="2" fill="rgba(59,130,246,0.2)"/>
      <path d="M14 1C7.93 1 3 5.93 3 12c0 8 11 22 11 22s11-14 11-22c0-6.07-4.93-11-11-11z" fill="#3B82F6"/>
      <circle cx="14" cy="12" r="4.5" fill="white"/>
    </svg></div>`,
  className: '', iconSize: [28, 36], iconAnchor: [14, 36],
})

interface AIResult {
  category: string
  severity: 'low' | 'medium' | 'high'
  aiTitle: string
  aiDescription: string
  department: string
  confidence: number
}

type Step = 'photo' | 'location' | 'description' | 'format' | 'confirm'

interface LatLng { lat: number; lng: number }

function MapMarker({ pos, onChange }: { pos: LatLng; onChange: (p: LatLng) => void }) {
  useMapEvents({ click(e) { onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) } })
  return <Marker position={[pos.lat, pos.lng]} icon={pinIcon} />
}

function MapRecenter({ pos }: { pos: LatLng }) {
  const map = useMap()
  useEffect(() => { map.setView([pos.lat, pos.lng], 15, { animate: true }) }, [pos.lat, pos.lng])
  return null
}

function buildFormalComplaint(ai: AIResult, addr: string, categoryLabel: string): string {
  const dept = DEPT_MAP[categoryLabel] ?? 'Mahalla inspeksiyasi'
  const addrLine = addr ? `${addr} manzilida ` : ''
  return `Hurmatli ${dept} rahbariyatiga,\n\n${addrLine}${ai.aiTitle.toLowerCase()}.\n\n${ai.aiDescription}\n\nUshbu muammoni imkon qadar tezroq hal etishingizni so'rayman.\n\nHurmat bilan.`
}

const STEP_LABELS: Record<Step, string> = {
  photo:       'Rasm va kategoriya',
  location:    'Joylashuv',
  description: 'Tavsif yozing',
  format:      'Tahrirlash',
  confirm:     'Tasdiqlash',
}

const STEP_ORDER: Step[] = ['photo', 'location', 'description', 'format', 'confirm']

// severity detection from keywords
function detectSeverity(text: string): 'low' | 'medium' | 'high' {
  const t = text.toLowerCase()
  const high = ['xavfli', 'jiddiy', 'tezkor', 'zudlik', 'katta', 'kuchli', 'yong\'in', 'oqayapti', 'toshib', 'singan', 'yorilgan']
  const low  = ['kichik', 'oz', 'estetik', 'rangpas', 'bo\'yoq', 'mayda']
  if (high.some(k => t.includes(k))) return 'high'
  if (low.some(k => t.includes(k)))  return 'low'
  return 'medium'
}

const SEV_LABEL = { low: "Oddiy", medium: "O'rta", high: 'Yuqori' }
const SEV_COLOR = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' }

// Format/clean user text
function formatText(raw: string, _categoryLabel: string): string {
  if (!raw.trim()) return raw
  let t = raw.trim()
  // Capitalize first letter
  t = t.charAt(0).toUpperCase() + t.slice(1)
  // Add period if missing
  if (!/[.!?]$/.test(t)) t += '.'
  return t
}

// Department map
const DEPT_MAP: Record<string, string> = {
  "Yo'l nosozligi":      "Yo'l xo'jaligi boshqarmasi",
  "Chiroq nosozligi":    "Kommunal xizmatlar bo'limi",
  "Suv muammosi":        "Suv ta'minoti xizmati",
  "Elektr muammosi":     "Elektr ta'minoti bo'limi",
  "Axlat muammosi":      "Sanitariya va atrof-muhit bo'limi",
  "Ko'kalamzorlashtirish": "Bog'-park xo'jaligi",
  "Bino nosozligi":      "Uy-joy xo'jaligi bo'limi",
  "Boshqa muammo":       "Mahalla inspeksiyasi",
}

// Estimated time map
const TIME_MAP: Record<string, Record<'low'|'medium'|'high', string>> = {
  "Yo'l nosozligi":   { low: '5-7 ish kuni', medium: '2-4 ish kuni', high: '1-2 ish kuni' },
  "Suv muammosi":     { low: '3-5 ish kuni', medium: '1-3 ish kuni', high: '24 soat ichida' },
  "Chiroq nosozligi": { low: '5-7 ish kuni', medium: '3-5 ish kuni', high: '2-3 ish kuni' },
}

function getEstimatedTime(cat: string, sev: 'low'|'medium'|'high'): string {
  return TIME_MAP[cat]?.[sev] ?? '3-7 ish kuni'
}

interface CreateProps {
  onSuccess?: () => void
}

export default function Create({ onSuccess }: CreateProps) {
  const [step, setStep] = useState<Step>('photo')
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('Yuklanmoqda...')
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formattedDesc, setFormattedDesc] = useState('')
  const [severity, setSeverity] = useState<'low'|'medium'|'high'>('medium')
  const [formatting, setFormatting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [descMode, setDescMode] = useState<'text'|'voice'>('text')
  const [descManuallyEdited, setDescManuallyEdited] = useState(false)

  const { pos, address, locating, handleGPS, setPos, setAddress } = useGPS()
  const { isListening, isSupported, transcript, interim, start, stop, reset } = useVoiceTranscription()

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const stepIndex = STEP_ORDER.indexOf(step)
  const selectedCategory = CATEGORIES.find(c => c.id === selectedCategoryId)

  // Auto-trigger GPS on mount
  useEffect(() => { handleGPS() }, [])

  // Sync voice transcript → description textarea
  useEffect(() => {
    if (transcript) setDescription(transcript)
  }, [transcript])

  // Rebuild formal complaint when GPS address resolves (if user hasn't manually edited)
  useEffect(() => {
    if (!aiResult || descManuallyEdited) return
    const catLabel = CATEGORIES.find(c => c.id === selectedCategoryId)?.label ?? ''
    const formal = buildFormalComplaint(aiResult, address, catLabel)
    setDescription(formal)
    setFormattedDesc(formal)
  }, [address, aiResult])

  // Cycle upload message: Yuklanmoqda → AI tahlil qilmoqda
  useEffect(() => {
    if (!uploading) { setUploadMsg('Yuklanmoqda...'); return }
    const t = setTimeout(() => setUploadMsg('AI tahlil qilmoqda...'), 2200)
    return () => clearTimeout(t)
  }, [uploading])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
    setUploading(true)
    setAiResult(null)
    const form = new FormData()
    form.append('photo', file)
    api.upload<{ url: string; thumbnailUrl: string; ai: AIResult | null }>('/upload', form)
      .then(({ url, ai }) => {
        setPhotoUrl(url)
        if (ai) {
          setAiResult(ai)
          const matched = CATEGORIES.find(c => c.id === ai.category)
          if (matched) setSelectedCategoryId(matched.id)
          if (ai.aiTitle) setTitle(ai.aiTitle)
          if (ai.aiDescription) {
            const catLabel = matched?.label ?? ''
            const formal = buildFormalComplaint(ai, address, catLabel)
            setDescription(formal)
            setFormattedDesc(formal)
          }
          setSeverity(ai.severity)
        }
      })
      .catch(() => setPhotoUrl(null))
      .finally(() => setUploading(false))
  }

  const canProceedFromPhoto = !!selectedCategoryId && !uploading

  const runFormat = useCallback(() => {
    if (!selectedCategory) return
    setStep('format')
    // If AI already produced a formatted description, show it immediately
    if (aiResult && formattedDesc.trim()) {
      setFormatting(false)
      return
    }
    setFormatting(true)
    const raw = description || title
    const formatted = formatText(raw, selectedCategory.label)
    const sev = detectSeverity(raw)
    setTimeout(() => {
      setFormattedDesc(formatted)
      setSeverity(sev)
      setFormatting(false)
    }, 1100)
  }, [description, title, selectedCategory, aiResult, formattedDesc])

  const handleSubmit = async () => {
    if (!selectedCategory) return
    ;(window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
    const reportAddress = address || 'Manzil aniqlanmadi'
    const reportLat = pos.lat || 41.2995
    const reportLng = pos.lng || 69.2401
    const reportTitle = title || formattedDesc.slice(0, 60)
    try {
      const ticket = await api.post<{ ticketId: string }>('/tickets', {
        photoUrl: photoUrl ?? '',
        category: selectedCategory.id,
        categoryLabel: selectedCategory.label,
        severity,
        aiTitle: reportTitle,
        aiDescription: formattedDesc,
        department: DEPT_MAP[selectedCategory.label] ?? 'Mahalla inspeksiyasi',
        address: reportAddress,
        lat: reportLat,
        lng: reportLng,
        district: '',
      })
      setSubmittedId(ticket.ticketId)
    } catch {
      // Server unavailable — create a local mock report so it still shows in Feed
      const localId = `ARZ-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
      setSubmittedId(localId)

      dispatchLocalReport({
        id: localId,
        userId: 'local-user',
        username: getTelegramUserName(),
        userAvatar: getTelegramUserName().charAt(0).toUpperCase(),
        category: selectedCategory.label,
        categoryIcon: selectedCategory.icon,
        categoryColor: selectedCategory.color,
        title: reportTitle,
        description: formattedDesc,
        address: reportAddress,
        lat: reportLat,
        lng: reportLng,
        photoColor: selectedCategory.bg,
        photoEmoji: selectedCategory.icon,
        status: 'sent',
        votes: 0,
        hasVoted: false,
        createdAt: 'Hozirgina',
        aiSummary: formattedDesc.slice(0, 100),
        severity,
        supporterAvatars: [],
      })
    }
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      resetForm()
      onSuccess?.()
    }, 4000)
  }

  const resetForm = () => {
    setStep('photo')
    setPhoto(null)
    setPhotoUrl(null)
    setAiResult(null)
    setSelectedCategoryId(null)
    setTitle('')
    setDescription('')
    setFormattedDesc('')
    setSeverity('medium')
    setSubmittedId(null)
    setDescManuallyEdited(false)
    reset()
  }

  const goBack = () => {
    haptic('select')
    if (stepIndex > 0) setStep(STEP_ORDER[stepIndex - 1])
  }

  // Telegram native button integration — must be called before any early return
  const mainBtnText =
    step === 'confirm'     ? 'Murojaatni Yuborish' :
    step === 'description' ? 'AI Formatlash →' :
    'Keyingi qadam →'
  const mainBtnEnabled =
    step === 'photo'       ? (!!selectedCategoryId && !uploading) :
    step === 'format'      ? (!formatting && !!formattedDesc.trim()) :
    step === 'description' ? (description.length >= 5 || title.length >= 3) :
    !submitted

  const handleNext = useCallback(() => {
    haptic('tap')
    if (step === 'photo')       setStep('location')
    else if (step === 'location')    setStep('description')
    else if (step === 'description') runFormat()
    else if (step === 'format')      setStep('confirm')
    else if (step === 'confirm')     void handleSubmit()
  }, [step, runFormat])

  useTelegramMainButton(mainBtnText, handleNext, !submitted && mainBtnEnabled)
  useTelegramBackButton(!submitted && stepIndex > 0 ? goBack : null)

  if (submitted) {
    return (
      <SuccessScreen
        arzId={submittedId ?? ''}
        category={selectedCategory}
        department={DEPT_MAP[selectedCategory?.label ?? ''] ?? 'Mahalla inspeksiyasi'}
      />
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0">
        {stepIndex > 0 && (
          <motion.button whileTap={{ scale: 0.88 }} onClick={goBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(148,163,184,0.12)' }}>
            <ChevronLeft size={18} strokeWidth={2.5} style={{ color: '#0F172A' }} />
          </motion.button>
        )}
        <div className="flex-1">
          <h2 className="text-[17px] font-extrabold" style={{ color: '#0F172A' }}>Yangi ariza</h2>
          <p className="text-[11px]" style={{ color: '#64748B' }}>{STEP_LABELS[step]}</p>
        </div>
        <span className="text-[12px] font-semibold" style={{ color: '#3B82F6' }}>
          {stepIndex + 1}/{STEP_ORDER.length}
        </span>
      </div>

      {/* Progress */}
      <div className="px-4 pb-3 shrink-0">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
            animate={{ width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {STEP_ORDER.map((s, i) => (
            <span key={s} className="text-[9px] font-medium" style={{ color: i <= stepIndex ? '#3B82F6' : '#CBD5E1' }}>
              {STEP_LABELS[s].split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: PHOTO + CATEGORY ── */}
          {step === 'photo' && (
            <motion.div key="photo" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.2 }}>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />

              {photo ? (
                <div className="relative mb-4 rounded-2xl overflow-hidden" style={{ height: 180 }}>
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {uploading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(0,0,0,0.55)' }}>
                      <Loader2 size={28} className="text-white animate-spin" />
                      <AnimatePresence mode="wait">
                        <motion.span key={uploadMsg} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="text-white text-[12px] font-semibold flex items-center gap-1.5">
                          {uploadMsg.includes('AI') && <Brain size={12} className="text-purple-300" />}
                          {uploadMsg}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  ) : (
                    <>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setPhoto(null); setPhotoUrl(null); setAiResult(null) }}
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white text-[11px] font-semibold"
                        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                        <RotateCcw size={11} strokeWidth={2.5} /> Qayta
                      </motion.button>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                        {aiResult ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold"
                            style={{ background: 'rgba(139,92,246,0.85)', backdropFilter: 'blur(8px)', color: '#fff' }}>
                            <Brain size={11} strokeWidth={2} /> AI tahlil qilindi · {aiResult.confidence}%
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-white text-[11px] font-medium">
                            <CheckCircle2 size={12} className="text-emerald-400" strokeWidth={2.5} /> Rasm tayyor
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 mb-4">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => cameraRef.current?.click()}
                    className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-6 border-2 border-dashed"
                    style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.03)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
                      <Camera size={22} className="text-white" strokeWidth={1.8} />
                    </div>
                    <p className="text-[12px] font-bold" style={{ color: '#3B82F6' }}>Kamera</p>
                    <p className="text-[10px]" style={{ color: '#94A3B8' }}>Suratga olish</p>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => galleryRef.current?.click()}
                    className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-6 border-2 border-dashed"
                    style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.03)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B5CF6,#6366F1)' }}>
                      <ImageIcon size={22} className="text-white" strokeWidth={1.8} />
                    </div>
                    <p className="text-[12px] font-bold" style={{ color: '#8B5CF6' }}>Galereya</p>
                    <p className="text-[10px]" style={{ color: '#94A3B8' }}>Yuklash</p>
                  </motion.button>
                </div>
              )}

              {/* AI Analysis Result Card — shown after upload + analysis */}
              {aiResult && !uploading && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                  className="mb-4 rounded-2xl overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.07),rgba(99,102,241,0.04))', border: '1.5px solid rgba(124,58,237,0.22)' }}
                >
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                      <Brain size={16} className="text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12.5px] font-black" style={{ color: '#6D28D9' }}>Gemini AI tahlil natijasi</p>
                      <p className="text-[10.5px]" style={{ color: '#94A3B8' }}>
                        Ishonch: <span style={{ color: '#7C3AED', fontWeight: 700 }}>{aiResult.confidence}%</span>
                        {selectedCategory && <span> · {selectedCategory.icon} {selectedCategory.label}</span>}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-xl" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}>✓ Tayyor</span>
                  </div>
                  <div className="px-4 py-3">
                    {aiResult.aiTitle && (
                      <p className="text-[13px] font-bold mb-1.5 leading-snug" style={{ color: '#0F172A' }}>{aiResult.aiTitle}</p>
                    )}
                    {aiResult.aiDescription && (
                      <p className="text-[11.5px] leading-relaxed" style={{ color: '#64748B' }}>
                        {aiResult.aiDescription.slice(0, 130)}{aiResult.aiDescription.length > 130 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Category */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Tag size={13} strokeWidth={2.5} style={{ color: '#3B82F6' }} />
                  <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>Muammo turini tanlang</p>
                  {aiResult ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{ background: 'rgba(139,92,246,0.1)', color: '#7C3AED' }}>
                      <Brain size={9} strokeWidth={2.5} /> AI tanladi
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#DC2626' }}>Majburiy</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => {
                    const isActive = selectedCategoryId === cat.id
                    return (
                      <motion.button key={cat.id} whileTap={{ scale: 0.94 }}
                        onClick={() => { haptic('select'); setSelectedCategoryId(cat.id) }}
                        className="flex items-center gap-2.5 px-3 py-3 rounded-2xl text-left"
                        style={{
                          background: isActive ? cat.color : '#fff',
                          border: isActive ? 'none' : '1.5px solid rgba(226,232,240,0.9)',
                          boxShadow: isActive ? `0 4px 14px ${cat.color}40` : '0 1px 4px rgba(15,23,42,0.06)',
                        }}>
                        <span className="text-lg shrink-0">{cat.icon}</span>
                        <p className="text-[12px] font-bold flex-1 truncate" style={{ color: isActive ? '#fff' : '#0F172A' }}>
                          {cat.label}
                        </p>
                        {isActive && <CheckCircle2 size={13} className="text-white shrink-0" strokeWidth={2.5} />}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('location')}
                disabled={!canProceedFromPhoto}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] shadow-lg shadow-blue-500/25 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)', minHeight: 52 }}>
                {canProceedFromPhoto ? 'Keyingi qadam →' : 'Kategoriya tanlang'}
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 2: LOCATION ── */}
          {step === 'location' && (
            <motion.div key="location" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.2 }}>
              {photo && (
                <div className="relative mb-4 rounded-xl overflow-hidden" style={{ height: 70 }}>
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                  <div className="absolute inset-0 flex items-center gap-2 px-3">
                    <ImageIcon size={12} className="text-emerald-300" strokeWidth={2.5} />
                    <span className="text-white text-[11px] font-medium">Rasm biriktirilgan</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <MapPin size={13} strokeWidth={2.5} style={{ color: '#3B82F6' }} />
                <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>Joylashuv</p>
                {locating && (
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: '#3B82F6' }}>
                    <Loader2 size={10} className="animate-spin" /> Aniqlanmoqda...
                  </span>
                )}
              </div>

              <div className="rounded-2xl overflow-hidden mb-3" style={{ height: 210 }}>
                <MapContainer center={[pos.lat, pos.lng]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="" />
                  <MapRecenter pos={pos} />
                  <MapMarker pos={pos} onChange={p => { setPos(p); setAddress(`${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`) }} />
                </MapContainer>
              </div>

              <div className="flex gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid rgba(226,232,240,0.9)' }}>
                  <MapPin size={12} className="text-blue-500 shrink-0" strokeWidth={2.5} />
                  <span className="text-[12px] truncate" style={{ color: '#334155' }}>{address}</span>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleGPS} disabled={locating}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)', minHeight: 44 }}>
                  {locating ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} strokeWidth={2.5} />}
                  GPS
                </motion.button>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('description')}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] shadow-lg shadow-blue-500/25"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)', minHeight: 52 }}>
                Keyingi qadam →
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 3: DESCRIPTION ── */}
          {step === 'description' && (
            <motion.div key="desc" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.2 }}>
              {/* Title */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={13} strokeWidth={2.5} style={{ color: '#3B82F6' }} />
                  <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>Sarlavha</p>
                </div>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={`Masalan: ${selectedCategory?.label ?? 'Muammo sarlavhasi'}`}
                  maxLength={80}
                  className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none"
                  style={{ background: '#F8FAFC', color: '#0F172A', border: '1.5px solid rgba(59,130,246,0.2)' }} />
              </div>

              {/* Description */}
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={13} strokeWidth={2.5} style={{ color: '#3B82F6' }} />
                <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>Batafsil tavsif</p>
              </div>

              {/* Mode toggle */}
              <div className="flex rounded-xl p-1 mb-3" style={{ background: 'rgba(148,163,184,0.12)' }}>
                {(['text', 'voice'] as const).map(m => (
                  <motion.button key={m} whileTap={{ scale: 0.95 }} onClick={() => { setDescMode(m); if (m === 'voice') reset() }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold"
                    style={{
                      background: descMode === m ? '#fff' : 'transparent',
                      color: descMode === m ? '#3B82F6' : '#94A3B8',
                      boxShadow: descMode === m ? '0 1px 4px rgba(15,23,42,0.08)' : 'none',
                    }}>
                    {m === 'text' ? <FileText size={14} strokeWidth={2.5} /> : <Mic size={14} strokeWidth={2.5} />}
                    {m === 'text' ? 'Matn' : 'Ovoz bilan'}
                  </motion.button>
                ))}
              </div>

              {descMode === 'text' ? (
                <>
                  {aiResult && !descManuallyEdited && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}>
                      <Brain size={12} strokeWidth={2} style={{ color: '#7C3AED' }} />
                      <p className="text-[11px]" style={{ color: '#7C3AED' }}>
                        AI rasmni tahlil qilib rasmiy murojaat yozdi — o'zgartirishingiz mumkin
                      </p>
                    </div>
                  )}
                  <textarea value={description} onChange={e => { setDescription(e.target.value); setDescManuallyEdited(true) }}
                    placeholder="Muammoni batafsil tasvirlab bering..."
                    rows={aiResult ? 8 : 5}
                    className="w-full px-4 py-3 rounded-2xl text-[13px] leading-relaxed outline-none resize-none"
                    style={{ background: '#F8FAFC', color: '#0F172A', border: `1.5px solid ${aiResult && !descManuallyEdited ? 'rgba(139,92,246,0.3)' : 'rgba(59,130,246,0.2)'}` }} />
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {/* Mic button */}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={isListening ? stop : start}
                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl relative"
                    style={{
                      background: isListening ? 'linear-gradient(135deg,#EF4444,#DC2626)' : 'linear-gradient(135deg,#3B82F6,#2563EB)',
                      boxShadow: isListening ? '0 0 0 12px rgba(239,68,68,0.15)' : '0 8px 32px rgba(59,130,246,0.35)',
                    }}
                    animate={isListening ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                    transition={{ repeat: isListening ? Infinity : 0, duration: 1 }}>
                    {isListening ? <MicOff size={28} className="text-white" strokeWidth={2} /> : <Mic size={28} className="text-white" strokeWidth={2} />}
                  </motion.button>

                  {/* Live transcript display */}
                  {(transcript || interim) && (
                    <div className="w-full rounded-2xl p-3 min-h-[80px]"
                      style={{ background: '#F8FAFC', border: '1.5px solid rgba(59,130,246,0.2)' }}>
                      <p className="text-[13px] leading-relaxed" style={{ color: '#0F172A' }}>
                        {transcript}
                        {interim && <span style={{ color: '#94A3B8' }}> {interim}</span>}
                      </p>
                    </div>
                  )}

                  <p className="text-[11.5px] text-center" style={{ color: '#94A3B8' }}>
                    {!isSupported
                      ? "Brauzer ovoz yozishni qo'llab-quvvatlamaydi"
                      : isListening
                      ? 'Gapiring... To\'xtatish uchun bosing'
                      : 'Bosib gapiring — real vaqtda matnga aylanadi'}
                  </p>
                </div>
              )}

              <motion.button whileTap={{ scale: 0.97 }} onClick={runFormat}
                disabled={(description.length < 5 && title.length < 3)}
                className="w-full mt-4 py-3.5 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)', minHeight: 52 }}>
                <Edit3 size={17} strokeWidth={2} />
                Formatlash va davom etish
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 4: FORMAT/EDIT ── */}
          {step === 'format' && (
            <motion.div key="format" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.2 }}>
              {formatting ? (
                <div className="rounded-2xl p-6 flex flex-col items-center gap-4" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#3B82F6' }}>
                    <Sparkles size={20} className="text-white" strokeWidth={2} />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold" style={{ color: '#0F172A' }}>Matn qayta ishlanmoqda</p>
                    <p className="text-[12px] mt-1" style={{ color: '#64748B' }}>Formatlash va tekshirish...</p>
                  </div>
                  <div className="w-full flex flex-col gap-2">
                    {['Imlo tekshirilmoqda...', 'Tuzilma to\'g\'irlanmoqda...', 'Og\'irlik aniqlanmoqda...'].map((t, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.25 }}
                        className="flex items-center gap-2">
                        <Loader2 size={11} className="text-blue-400 animate-spin shrink-0" strokeWidth={2} />
                        <p className="text-[11.5px]" style={{ color: '#64748B' }}>{t}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* AI or manual badge */}
                  {aiResult && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-2xl"
                      style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}>
                      <Brain size={14} strokeWidth={2} style={{ color: '#7C3AED' }} />
                      <div className="flex-1">
                        <p className="text-[12px] font-bold" style={{ color: '#7C3AED' }}>Gemini AI tahlil qildi</p>
                        <p className="text-[10px]" style={{ color: '#94A3B8' }}>Ishonch darajasi: {aiResult.confidence}% · O'zgartirishingiz mumkin</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Severity badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={14} strokeWidth={2.5} style={{ color: SEV_COLOR[severity] }} />
                    <span className="text-[12px] font-bold px-2.5 py-1 rounded-xl" style={{ background: `${SEV_COLOR[severity]}18`, color: SEV_COLOR[severity] }}>
                      {SEV_LABEL[severity]} og'irlik darajasi aniqlandi
                    </span>
                  </div>

                  {/* Editable formatted description */}
                  <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1.5px solid rgba(59,130,246,0.2)', boxShadow: '0 4px 16px rgba(59,130,246,0.08)' }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
                      <div className="flex items-center gap-2">
                        <Edit3 size={14} className="text-white" strokeWidth={2} />
                        <span className="text-[13px] font-bold text-white">Tahrirlash mumkin</span>
                      </div>
                      <span className="text-[10px] text-white/70">Kerak bo'lsa o'zgartiring</span>
                    </div>
                    <div className="p-4" style={{ background: '#fff' }}>
                      {title && (
                        <div className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                          <p className="text-[10px] font-semibold mb-1" style={{ color: '#94A3B8' }}>SARLAVHA</p>
                          <input value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full text-[14px] font-bold outline-none" style={{ color: '#0F172A', background: 'transparent' }} />
                        </div>
                      )}
                      <p className="text-[10px] font-semibold mb-2" style={{ color: '#94A3B8' }}>TAVSIF</p>
                      <textarea value={formattedDesc} onChange={e => setFormattedDesc(e.target.value)}
                        rows={5} className="w-full text-[13px] leading-relaxed outline-none resize-none"
                        style={{ color: '#334155', background: 'transparent' }} />
                    </div>
                  </div>

                  {/* Category + severity change */}
                  <div className="rounded-2xl p-4 mb-4 flex items-center justify-between"
                    style={{ background: '#F8FAFC', border: '1px solid rgba(226,232,240,0.9)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedCategory?.icon}</span>
                      <div>
                        <p className="text-[12px] font-bold" style={{ color: '#0F172A' }}>{selectedCategory?.label}</p>
                        <p className="text-[10px]" style={{ color: '#94A3B8' }}>Kategoriya</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {(['low', 'medium', 'high'] as const).map(s => (
                        <motion.button key={s} whileTap={{ scale: 0.9 }} onClick={() => setSeverity(s)}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                          style={{
                            background: severity === s ? SEV_COLOR[s] : 'rgba(148,163,184,0.12)',
                            color: severity === s ? '#fff' : '#94A3B8',
                          }}>
                          {SEV_LABEL[s]}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('confirm')}
                    disabled={!formattedDesc.trim()}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] shadow-lg shadow-blue-500/25 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)', minHeight: 52 }}>
                    Tasdiqlashga o'tish →
                  </motion.button>
                </>
              )}
            </motion.div>
          )}

          {/* ── STEP 5: CONFIRM ── */}
          {step === 'confirm' && selectedCategory && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={14} strokeWidth={2.5} style={{ color: '#10B981' }} />
                <p className="text-[14px] font-bold" style={{ color: '#0F172A' }}>Murojaatni tasdiqlang</p>
              </div>

              <div className="rounded-2xl overflow-hidden mb-3" style={{ border: '1px solid rgba(148,163,184,0.15)', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
                {photo && <img src={photo} alt="" className="w-full object-cover" style={{ height: 130 }} />}
                <div className="p-4" style={{ background: '#fff' }}>
                  <div className="flex items-center gap-2.5 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: selectedCategory.bg }}>
                      {selectedCategory.icon}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold" style={{ color: '#0F172A' }}>{title || formattedDesc.slice(0, 60)}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: selectedCategory.color }}>{selectedCategory.label}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                          style={{ background: `${SEV_COLOR[severity]}18`, color: SEV_COLOR[severity] }}>
                          {SEV_LABEL[severity]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ConfirmRow icon={<MapPin size={12} style={{ color: '#3B82F6' }} />} label="Manzil" value={address} />
                  {formattedDesc && <ConfirmRow icon={<FileText size={12} style={{ color: '#8B5CF6' }} />} label="Tavsif" value={formattedDesc.slice(0, 120) + (formattedDesc.length > 120 ? '...' : '')} />}
                  <ConfirmRow icon={<Building2 size={12} style={{ color: '#F59E0B' }} />} label="Yuboriladi" value={DEPT_MAP[selectedCategory.label] ?? 'Mahalla inspeksiyasi'} />
                  <ConfirmRow icon={<CheckCircle2 size={12} style={{ color: '#10B981' }} />} label="Taxminiy muddat" value={getEstimatedTime(selectedCategory.label, severity)} />
                </div>
              </div>

              <div className="rounded-xl p-3 mb-4 flex items-start gap-2.5"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <AlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                <p className="text-[12px] leading-relaxed" style={{ color: '#92400E' }}>
                  Yuborilgach murojaat tegishli bo'limga yo'naltiriladi. Holati o'zgarganda bildirishnoma olasiz.
                </p>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                className="w-full py-4 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/30"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)', minHeight: 56 }}>
                <Send size={17} strokeWidth={2.5} />
                Murojaatni Yuborish
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

function ConfirmRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2.5 py-2.5" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>{label}</p>
        <p className="text-[12.5px] leading-snug" style={{ color: '#334155' }}>{value}</p>
      </div>
    </div>
  )
}

function SuccessScreen({ arzId, category, department }: {
  arzId: string
  category?: { label: string; icon: string; color: string }
  department: string
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full px-6 text-center"
      style={{ background: '#F8FAFC' }}>
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 220, delay: 0.1 }}
        className="w-28 h-28 rounded-full flex items-center justify-center mb-5 shadow-2xl shadow-emerald-500/25"
        style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
        <CheckCircle2 size={52} className="text-white" strokeWidth={1.8} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="w-full">
        <h2 className="text-[26px] font-extrabold mb-1" style={{ color: '#0F172A' }}>Rahmat!</h2>
        <p className="text-[14px] mb-1" style={{ color: '#64748B' }}>Murojaatingiz muvaffaqiyatli qabul qilindi</p>
        <p className="text-[13px] mb-5" style={{ color: '#94A3B8' }}>Siz mahallangizni yaxshilashga hissa qo'shdingiz</p>

        {/* Info cards */}
        <div className="flex flex-col gap-2.5 mb-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.9)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${category?.color ?? '#3B82F6'}18` }}>
              {category?.icon ?? '📋'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>YUBORILDI</p>
              <p className="text-[12.5px] font-bold truncate" style={{ color: '#0F172A' }}>{department}</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <div className="flex-1 flex flex-col items-center px-3 py-3 rounded-2xl"
              style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <p className="text-[10px] font-semibold mb-1" style={{ color: '#64748B' }}>Murojaat ID</p>
              <p className="font-mono text-[13px] font-black" style={{ color: '#3B82F6' }}>{arzId}</p>
            </div>
            <div className="flex-1 flex flex-col items-center px-3 py-3 rounded-2xl"
              style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <p className="text-[10px] font-semibold mb-1" style={{ color: '#64748B' }}>XP qo'shildi</p>
              <p className="text-[13px] font-black" style={{ color: '#10B981' }}>+150 XP</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl mx-auto"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Zap size={14} className="text-amber-500" strokeWidth={2.5} />
          <p className="text-[12px] font-semibold" style={{ color: '#92400E' }}>
            Arizalar ro'yxatiga qaytilmoqda...
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

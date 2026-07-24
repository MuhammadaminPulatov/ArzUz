import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, RotateCcw, MapPin, Mic, MicOff, FileText, Sparkles,
  CheckCircle2, Send, ChevronLeft, AlertCircle, Loader2,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CATEGORIES } from '../data/mock'

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
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
})

type Step = 'photo' | 'location' | 'description' | 'ai' | 'confirm'

interface LatLng { lat: number; lng: number }

function MapMarker({ pos, onChange }: { pos: LatLng; onChange: (p: LatLng) => void }) {
  useMapEvents({ click(e) { onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) } })
  return <Marker position={[pos.lat, pos.lng]} icon={pinIcon} />
}

const STEP_LABELS: Record<Step, string> = {
  photo: 'Rasm olish',
  location: 'Joylashuv',
  description: 'Tavsif',
  ai: 'AI Tahlil',
  confirm: 'Tasdiqlash',
}

const STEP_ORDER: Step[] = ['photo', 'location', 'description', 'ai', 'confirm']

const AI_ANALYSIS_TEMPLATES = [
  {
    emoji: '🚧',
    categoryId: 'road',
    severity: 'Yuqori',
    severityColor: '#EF4444',
    title: "Yo'l yuzasida zararlanish aniqlandi",
    problems: [
      "Asfalt yuzasida 30-50 sm diametrli jarlik",
      "Avtotransport harakatiga bevosita xavf",
      "Yomg'irli havoda suv to'planishi ehtimoli",
    ],
    recommendation: "Zudlik bilan yo'l ta'mirlash ishlari o'tkazilishi kerak. Vaqtinchalik to'siq o'rnatish tavsiya etiladi.",
    department: "Yo'l xo'jaligi boshqarmasi",
    urgency: 'Tezkor',
    urgencyColor: '#EF4444',
    estimatedTime: '1-3 ish kuni',
  },
  {
    emoji: '💡',
    categoryId: 'light',
    severity: "O'rta",
    severityColor: '#F59E0B',
    title: "Yoritish tizimida nosozlik aniqlandi",
    problems: [
      "Ko'cha chiroqlari ishlamayapti",
      "Tungi xavfsizlik darajasi pasaygan",
      "Pedestrlar xavfsizligi ta'minlanmagan",
    ],
    recommendation: "Elektr tizimini tekshirish va nosoz chiroqlarni almashtirish zarur.",
    department: "Kommunal xizmatlar bo'limi",
    urgency: "Rejalashtirilgan",
    urgencyColor: '#F59E0B',
    estimatedTime: '3-5 ish kuni',
  },
  {
    emoji: '💧',
    categoryId: 'water',
    severity: 'Yuqori',
    severityColor: '#EF4444',
    title: "Suv quvuridagi muammo aniqlandi",
    problems: [
      "Yer osti quvurida sizib chiqish mavjud",
      "Suv isrof: taxminan 150-200 litr/soat",
      "Ko'cha yuzasida nam va botqoqlik",
    ],
    recommendation: "Suv ta'minoti xizmatiga tezda murojaat qilish va nosoz quvurni almashtirish.",
    department: "Suv ta'minoti xizmati",
    urgency: 'Tezkor',
    urgencyColor: '#EF4444',
    estimatedTime: '24 soat ichida',
  },
]

interface AIResult {
  emoji: string
  categoryId: string
  severity: string
  severityColor: string
  title: string
  problems: string[]
  recommendation: string
  department: string
  urgency: string
  urgencyColor: string
  estimatedTime: string
  category: string
  categoryIcon: string
}

interface CreateProps {
  onSuccess?: () => void
}

export default function Create({ onSuccess }: CreateProps) {
  const [step, setStep] = useState<Step>('photo')
  const [photo, setPhoto] = useState<string | null>(null)
  const [pos, setPos] = useState<LatLng>({ lat: 41.2995, lng: 69.2401 })
  const [address, setAddress] = useState('Toshkent sh., Chorsu bozori atrofi')
  const [locating, setLocating] = useState(false)
  const [description, setDescription] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [descMode, setDescMode] = useState<'text' | 'voice'>('text')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stepIndex = STEP_ORDER.indexOf(step)

  const goBack = () => {
    if (stepIndex > 0) setStep(STEP_ORDER[stepIndex - 1])
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhoto(ev.target?.result as string)
      setStep('location')
    }
    reader.readAsDataURL(file)
  }

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

  const startRecording = () => {
    setIsRecording(true)
    setRecordingSeconds(0)
    timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000)

    // Try real Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'uz-UZ'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('')
        setDescription(transcript)
      }
      recognition.start()
      ;(window as any)._recognition = recognition
    } else {
      // Simulate
      setTimeout(() => {
        setDescription("Ko'chada katta muammo bor, tezda hal qilish kerak. Aholining ko'p qatlamiga ta'sir qilmoqda.")
        stopRecording()
      }, 4000)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
    const rec = (window as any)._recognition
    if (rec) { try { rec.stop() } catch (_) {} }
  }

  const runAI = useCallback(() => {
    setStep('ai')
    setAiLoading(true)
    const template = AI_ANALYSIS_TEMPLATES[Math.floor(Math.random() * AI_ANALYSIS_TEMPLATES.length)]
    const cat = CATEGORIES.find(c => c.id === template.categoryId) || CATEGORIES[0]
    setTimeout(() => {
      setAiResult({ ...template, category: cat.label, categoryIcon: cat.icon })
      setAiLoading(false)
    }, 3200)
  }, [])

  const handleSubmit = () => {
    setSubmitted(true)
    ;(window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
    setTimeout(() => {
      setSubmitted(false)
      resetForm()
      onSuccess?.()
    }, 3500)
  }

  const resetForm = () => {
    setStep('photo')
    setPhoto(null)
    setDescription('')
    setAiResult(null)
    setAiLoading(false)
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  if (submitted) return <SuccessScreen onReset={resetForm} />

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0">
        {stepIndex > 0 && (
          <motion.button whileTap={{ scale: 0.88 }} onClick={goBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(148,163,184,0.12)' }}>
            <ChevronLeft size={18} strokeWidth={2.5} style={{ color: 'var(--tg-theme-text-color, #0F172A)' }} />
          </motion.button>
        )}
        <div className="flex-1">
          <h2 className="text-[17px] font-extrabold" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
            Yangi ariza
          </h2>
          <p className="text-[11px]" style={{ color: '#64748B' }}>{STEP_LABELS[step]}</p>
        </div>
        <span className="text-[12px] font-semibold" style={{ color: '#3B82F6' }}>
          {stepIndex + 1}/{STEP_ORDER.length}
        </span>
      </div>

      {/* Progress bar */}
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
              {STEP_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <AnimatePresence mode="wait">
          {/* ── PHOTO ── */}
          {step === 'photo' && (
            <motion.div key="photo" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.22 }}>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed"
                style={{ height: 240, borderColor: 'rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.03)' }}
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/30"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                >
                  <Camera size={34} className="text-white" strokeWidth={1.8} />
                </motion.div>
                <div className="text-center px-6">
                  <p className="text-[16px] font-bold text-blue-500">Rasmga oling yoki yuklang</p>
                  <p className="text-[12px] mt-1" style={{ color: '#94A3B8' }}>Muammo joylashgan joyni aniq ko'rsating</p>
                </div>
              </motion.button>

              <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <p className="text-[13px] font-semibold mb-2" style={{ color: '#1D4ED8' }}>📸 Yaxshi rasm uchun maslahatlar:</p>
                {["Muammoni yaqindan, aniq suratga oling", "Yorug' joyda oling", "Bir nechta burchakdan ko'rsating"].map((tip, i) => (
                  <p key={i} className="text-[12px] py-0.5" style={{ color: '#64748B' }}>• {tip}</p>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── LOCATION ── */}
          {step === 'location' && (
            <motion.div key="location" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.22 }}>
              {photo && (
                <div className="relative mb-4 rounded-2xl overflow-hidden" style={{ height: 110 }}>
                  <img src={photo} alt="Rasm" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setPhoto(null); setStep('photo') }}
                    className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-white text-[11px] font-medium"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
                  >
                    <RotateCcw size={11} strokeWidth={2.5} /> Qayta olish
                  </motion.button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[11px]">
                    <CheckCircle2 size={11} className="text-emerald-400" strokeWidth={2.5} /> Rasm tayyor
                  </div>
                </div>
              )}

              <p className="text-[14px] font-bold mb-3" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
                📍 Muammo joylashuvini belgilang
              </p>

              <div className="rounded-2xl overflow-hidden mb-3" style={{ height: 200 }}>
                <MapContainer center={[pos.lat, pos.lng]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="" />
                  <MapMarker pos={pos} onChange={(p) => { setPos(p); setAddress(`${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`) }} />
                </MapContainer>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'var(--tg-theme-secondary-bg-color, #F1F5F9)' }}>
                  <MapPin size={14} className="text-blue-500 shrink-0" strokeWidth={2.5} />
                  <span className="text-[12px] truncate" style={{ color: 'var(--tg-theme-text-color, #334155)' }}>{address}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleGPS}
                  disabled={locating}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white bg-blue-500 shrink-0"
                  style={{ minHeight: 44 }}
                >
                  {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} strokeWidth={2.5} />}
                  GPS
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep('description')}
                className="w-full mt-4 py-3.5 rounded-2xl text-white font-bold text-[15px] shadow-lg shadow-blue-500/25"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', minHeight: 52 }}
              >
                Keyingi qadam →
              </motion.button>
            </motion.div>
          )}

          {/* ── DESCRIPTION ── */}
          {step === 'description' && (
            <motion.div key="desc" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.22 }}>
              <p className="text-[14px] font-bold mb-3" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
                📝 Muammoni tasvirlab bering
              </p>

              {/* Mode toggle */}
              <div
                className="flex rounded-xl p-1 mb-4"
                style={{ background: 'rgba(148,163,184,0.12)' }}
              >
                {(['text', 'voice'] as const).map((m) => (
                  <motion.button
                    key={m}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDescMode(m)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                    style={{
                      background: descMode === m ? 'var(--tg-theme-secondary-bg-color, #fff)' : 'transparent',
                      color: descMode === m ? '#3B82F6' : '#94A3B8',
                      boxShadow: descMode === m ? '0 1px 4px rgba(15,23,42,0.08)' : 'none',
                    }}
                  >
                    {m === 'text' ? <FileText size={15} strokeWidth={2.5} /> : <Mic size={15} strokeWidth={2.5} />}
                    {m === 'text' ? 'Matn yozish' : 'Ovoz yozish'}
                  </motion.button>
                ))}
              </div>

              {descMode === 'text' ? (
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Muammoni batafsil tasvirlab bering: qachon paydo bo'ldi, qanchalik xavfli, necha kishi ta'sirlanmoqda..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-2xl text-[13px] leading-relaxed outline-none resize-none"
                  style={{
                    background: 'var(--tg-theme-secondary-bg-color, #F8FAFC)',
                    color: 'var(--tg-theme-text-color, #0F172A)',
                    border: '1.5px solid rgba(59,130,246,0.2)',
                  }}
                />
              ) : (
                <div className="flex flex-col items-center">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={isRecording ? stopRecording : startRecording}
                    className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl mb-4"
                    style={{
                      background: isRecording
                        ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                        : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                      boxShadow: isRecording ? '0 0 0 12px rgba(239,68,68,0.15)' : '0 8px 32px rgba(59,130,246,0.35)',
                    }}
                    animate={isRecording ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                    transition={{ repeat: isRecording ? Infinity : 0, duration: 1 }}
                  >
                    {isRecording ? <MicOff size={32} className="text-white" strokeWidth={2} /> : <Mic size={32} className="text-white" strokeWidth={2} />}
                  </motion.button>
                  {isRecording && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[14px] font-mono font-bold text-red-500">{fmtTime(recordingSeconds)}</span>
                      <span className="text-[12px]" style={{ color: '#64748B' }}>yozilmoqda...</span>
                    </motion.div>
                  )}
                  <p className="text-[12px] text-center" style={{ color: '#94A3B8' }}>
                    {isRecording ? 'Gapiring, keyin to\'xtatish uchun bosing' : 'Bosing va gapiring'}
                  </p>
                </div>
              )}

              {description.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl p-3"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  <p className="text-[11px] font-semibold text-emerald-600 mb-1">✅ Matn tayyor:</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--tg-theme-text-color, #334155)' }}>{description}</p>
                </motion.div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={runAI}
                disabled={description.length < 5}
                className="w-full mt-4 py-3.5 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', minHeight: 52 }}
              >
                <Sparkles size={18} strokeWidth={2} />
                AI bilan tahlil qiling
              </motion.button>
            </motion.div>
          )}

          {/* ── AI ── */}
          {step === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.22 }}>
              {aiLoading ? (
                <AILoading />
              ) : aiResult ? (
                <>
                  <AIResultFull result={aiResult} />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => setStep('confirm')}
                    className="w-full mt-5 py-3.5 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', minHeight: 52 }}
                  >
                    Tasdiqlashga o'tish →
                  </motion.button>
                </>
              ) : null}
            </motion.div>
          )}

          {/* ── CONFIRM ── */}
          {step === 'confirm' && aiResult && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.22 }}>
              <p className="text-[14px] font-bold mb-4" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
                ✅ Murojaatni tasdiqlang
              </p>

              <div className="rounded-2xl overflow-hidden mb-3" style={{ border: '1px solid rgba(148,163,184,0.15)', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
                {photo && <img src={photo} alt="Rasm" className="w-full object-cover" style={{ height: 140 }} />}
                <div className="p-4" style={{ background: 'var(--tg-theme-secondary-bg-color, #fff)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{aiResult.emoji}</span>
                    <div>
                      <p className="text-[14px] font-bold" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>{aiResult.title}</p>
                      <p className="text-[11px]" style={{ color: '#64748B' }}>{aiResult.category}</p>
                    </div>
                  </div>
                  <ConfirmRow icon="📍" label="Manzil" value={address} />
                  <ConfirmRow icon="📋" label="Tavsif" value={description} />
                  <ConfirmRow icon="🏢" label="Yuboriladi" value={aiResult.department} />
                  <ConfirmRow icon="⏱️" label="Taxminiy muddat" value={aiResult.estimatedTime} />
                </div>
              </div>

              <div
                className="rounded-xl p-3 mb-4 flex items-start gap-2"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                <p className="text-[12px] leading-relaxed" style={{ color: '#92400E' }}>
                  Yuborish tugmasini bosganingizdan so'ng murojaat tegishli bo'limga yo'naltiriladi va holatini kuzatib borishingiz mumkin.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/30"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', minHeight: 56 }}
              >
                <Send size={18} strokeWidth={2.5} />
                Murojaatni Yuborish 🚀
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ConfirmRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-2 py-2" style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
      <span className="text-sm shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>{label}</p>
        <p className="text-[12.5px] leading-snug" style={{ color: 'var(--tg-theme-text-color, #334155)' }}>{value}</p>
      </div>
    </div>
  )
}

function AILoading() {
  const steps = [
    "Rasm tahlil qilinmoqda...",
    "Muammo turi aniqlanmoqda...",
    "Og'irlik darajasi baholanmoqda...",
    "Tegishli bo'lim aniqlanmoqda...",
  ]
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrentStep(s => Math.min(s + 1, steps.length - 1)), 750)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--tg-theme-secondary-bg-color, #fff)', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
      <div className="flex items-center gap-3 mb-5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center"
        >
          <Sparkles size={18} className="text-white" strokeWidth={2} />
        </motion.div>
        <div>
          <p className="text-[14px] font-bold" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>AI Tahlil qilmoqda</p>
          <AnimatePresence mode="wait">
            <motion.p key={currentStep} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-[11px]" style={{ color: '#64748B' }}>
              {steps[currentStep]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: i <= currentStep ? 'rgba(59,130,246,0.12)' : 'rgba(148,163,184,0.1)' }}>
              {i < currentStep ? (
                <CheckCircle2 size={12} className="text-blue-500" strokeWidth={2.5} />
              ) : i === currentStep ? (
                <Loader2 size={12} className="text-blue-400 animate-spin" strokeWidth={2.5} />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              )}
            </div>
            <p className="text-[12px]" style={{ color: i <= currentStep ? 'var(--tg-theme-text-color, #334155)' : '#CBD5E1' }}>{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <div className="h-4 rounded-full shimmer w-full" />
        <div className="h-4 rounded-full shimmer w-4/5" />
        <div className="h-4 rounded-full shimmer w-3/5" />
      </div>
    </div>
  )
}

interface AIResultFullProps {
  result: AIResult
}

function AIResultFull({ result }: AIResultFullProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid rgba(59,130,246,0.2)', boxShadow: '0 4px 24px rgba(59,130,246,0.1)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-white" strokeWidth={2} />
          <span className="text-[13px] font-bold text-white">AI Tahlil Natijasi</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <span className="text-[10px] font-bold text-white">{result.urgency}</span>
        </div>
      </div>

      <div className="p-4" style={{ background: 'var(--tg-theme-secondary-bg-color, #fff)' }}>
        {/* Category & severity */}
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 15 }}
            className="text-3xl"
          >
            {result.emoji}
          </motion.div>
          <div>
            <p className="text-[15px] font-extrabold" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>{result.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-semibold text-blue-500">{result.categoryIcon} {result.category}</span>
              <span className="text-[11px] font-bold" style={{ color: result.severityColor }}>• {result.severity} og'irlik</span>
            </div>
          </div>
        </div>

        {/* Problems */}
        <div className="mb-4">
          <p className="text-[12px] font-bold mb-2" style={{ color: '#64748B' }}>🔍 ANIQLANGAN MUAMMOLAR:</p>
          {result.problems.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="flex items-start gap-2 mb-2"
            >
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: result.severityColor }} />
              <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--tg-theme-text-color, #334155)' }}>{p}</p>
            </motion.div>
          ))}
        </div>

        {/* Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl p-3 mb-3"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}
        >
          <p className="text-[11px] font-bold text-emerald-600 mb-1.5">💡 TAVSIYA:</p>
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--tg-theme-text-color, #334155)' }}>{result.recommendation}</p>
        </motion.div>

        {/* Meta */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex gap-2"
        >
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: 'rgba(59,130,246,0.07)' }}>
            <p className="text-[10px]" style={{ color: '#64748B' }}>Yuboriladi</p>
            <p className="text-[11px] font-bold" style={{ color: '#3B82F6' }}>{result.department}</p>
          </div>
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: 'rgba(245,158,11,0.07)' }}>
            <p className="text-[10px]" style={{ color: '#64748B' }}>Taxminiy muddat</p>
            <p className="text-[11px] font-bold" style={{ color: '#B45309' }}>{result.estimatedTime}</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function SuccessScreen({ onReset: _onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full px-6 text-center"
      style={{ background: 'var(--tg-theme-bg-color, #F8FAFC)' }}
    >
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 220, delay: 0.1 }}
        className="w-28 h-28 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/25"
        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
      >
        <CheckCircle2 size={52} className="text-white" strokeWidth={1.8} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-[24px] font-extrabold mb-2" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
          Yuborildi! 🎉
        </h2>
        <p className="text-[14px] leading-relaxed mb-2" style={{ color: '#64748B' }}>
          Murojaatingiz muvaffaqiyatli qabul qilindi.
        </p>
        <p className="text-[14px] leading-relaxed mb-4" style={{ color: '#64748B' }}>
          Holati haqida sizga xabar berib boramiz. Rahmat! 🙏
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-2" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
          <span className="text-[13px] font-semibold">Murojaat ID:</span>
          <span className="font-mono text-[14px] font-bold">#ARZ-{Math.floor(1000 + Math.random() * 9000)}</span>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl block" style={{ background: 'rgba(16,185,129,0.1)', color: '#065F46' }}>
          <span className="text-[13px] font-semibold">+150 XP qo'shildi! 🏆</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/env'

export interface AIAnalysis {
  category: string
  severity: 'low' | 'medium' | 'high'
  aiTitle: string
  aiDescription: string
  department: string
  confidence: number
}

const VALID_CATS = ['road', 'light', 'water', 'electric', 'trash', 'tree', 'building', 'other']
const VALID_SEVS = ['low', 'medium', 'high']

const PROMPT = `Sen Toshkent shahridagi mahalla muammolarini tahlil qiladigan AI yordamchisisan.
Rasmga qarab muammoni aniqlang. FAQAT quyidagi JSON formatida javob bering, boshqa hech narsa yozmang:
{
  "category": "road|light|water|electric|trash|tree|building|other",
  "severity": "low|medium|high",
  "aiTitle": "O'zbekcha qisqa sarlavha (max 60 ta belgi)",
  "aiDescription": "O'zbekcha batafsil tavsif 2-3 gapdan iborat",
  "department": "Mas'ul bo'lim nomi o'zbekcha",
  "confidence": 85
}

Kategoriyalar:
- road: yo'l chuqurlari, asfalt zararlangan, piyoda yo'li singan
- light: ko'cha chiroqlari, yoritish muammosi
- water: suv quvuri oqishi, sel, kanalizatsiya
- electric: elektr infratuzilma muammosi
- trash: axlat, chiqindi boshqarish
- tree: yiqilgan daraxtlar, haddan ziyod o'simlik
- building: bino yoki inshoot zararlangan
- other: boshqa muammo

Mas'ul bo'limlar:
- road → "Yo'l xo'jaligi boshqarmasi"
- light → "Kommunal xizmatlar bo'limi"
- water → "Suv ta'minoti xizmati"
- electric → "Elektr ta'minoti bo'limi"
- trash → "Sanitariya va atrof-muhit bo'limi"
- tree → "Bog'-park xo'jaligi"
- building → "Uy-joy xo'jaligi bo'limi"
- other → "Mahalla inspeksiyasi"

Og'irlik: high=xavfli, medium=o'rta, low=kichik`

export async function analyzePhoto(imageBuffer: Buffer, mimeType: string): Promise<AIAnalysis | null> {
  if (!env.geminiKey) return null

  try {
    const genAI = new GoogleGenerativeAI(env.geminiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent([
      PROMPT,
      { inlineData: { data: imageBuffer.toString('base64'), mimeType } },
    ])

    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as Partial<AIAnalysis>

    return {
      category: VALID_CATS.includes(parsed.category ?? '') ? (parsed.category as string) : 'other',
      severity: (VALID_SEVS.includes(parsed.severity ?? '') ? parsed.severity : 'medium') as AIAnalysis['severity'],
      aiTitle: String(parsed.aiTitle ?? '').slice(0, 60),
      aiDescription: String(parsed.aiDescription ?? ''),
      department: String(parsed.department ?? 'Mahalla inspeksiyasi'),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence ?? 70))),
    }
  } catch {
    return null
  }
}

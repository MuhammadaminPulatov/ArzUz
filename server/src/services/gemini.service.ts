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
{"category":"road|light|water|electric|trash|tree|building|other","severity":"low|medium|high","aiTitle":"O'zbekcha sarlavha max 60 belgi","aiDescription":"O'zbekcha batafsil tavsif 2-3 gap","department":"Mas'ul bo'lim o'zbekcha","confidence":85}

Kategoriyalar: road=yo'l muammosi, light=chiroq, water=suv, electric=elektr, trash=axlat, tree=daraxt, building=bino, other=boshqa
Mas'ul bo'limlar: road=Yo'l xo'jaligi boshqarmasi, light=Kommunal xizmatlar bo'limi, water=Suv ta'minoti xizmati, electric=Elektr ta'minoti bo'limi, trash=Sanitariya va atrof-muhit bo'limi, tree=Bog'-park xo'jaligi, building=Uy-joy xo'jaligi bo'limi, other=Mahalla inspeksiyasi
Og'irlik: high=xavfli, medium=o'rta, low=kichik`

export async function analyzePhoto(imageBuffer: Buffer, mimeType: string): Promise<AIAnalysis | null> {
  if (!env.geminiKey) return null

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.geminiKey}`

    const body = {
      contents: [{
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: imageBuffer.toString('base64') } },
        ],
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) return null

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
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

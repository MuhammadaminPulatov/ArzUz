import { useState, useRef, useCallback } from 'react'

const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

interface VoiceTranscriptionResult {
  isListening: boolean
  isSupported: boolean
  transcript: string      // accumulated final text
  interim: string         // live interim (not yet final)
  start: () => void
  stop: () => void
  reset: () => void
}

export function useVoiceTranscription(
  onFinal?: (text: string) => void,
): VoiceTranscriptionResult {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<any>(null)
  const finalRef = useRef('')  // accumulated final text across sessions

  const start = useCallback(() => {
    if (!SR) return
    if (recognitionRef.current) recognitionRef.current.abort()

    const r = new SR()
    r.lang = 'uz-UZ'
    r.continuous = true
    r.interimResults = true
    r.maxAlternatives = 1

    r.onstart = () => setIsListening(true)
    r.onend = () => {
      setIsListening(false)
      setInterim('')
    }

    r.onresult = (event: any) => {
      let sessionFinal = ''
      let sessionInterim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          sessionFinal += t
        } else {
          sessionInterim += t
        }
      }
      if (sessionFinal) {
        finalRef.current += (finalRef.current ? ' ' : '') + sessionFinal.trim()
        setTranscript(finalRef.current)
        onFinal?.(finalRef.current)
      }
      setInterim(sessionInterim)
    }

    r.onerror = (e: any) => {
      if (e.error !== 'no-speech') setIsListening(false)
    }

    recognitionRef.current = r
    try { r.start() } catch { /* already started */ }
  }, [onFinal])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterim('')
  }, [])

  const reset = useCallback(() => {
    recognitionRef.current?.abort()
    finalRef.current = ''
    setTranscript('')
    setInterim('')
    setIsListening(false)
  }, [])

  return { isListening, isSupported: !!SR, transcript, interim, start, stop, reset }
}

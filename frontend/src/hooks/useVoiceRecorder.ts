import { useState, useRef } from 'react'

export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = () => {
    setIsRecording(true)
    setRecordingSeconds(0)
    timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'uz-UZ'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('')
        onTranscript(transcript)
      }
      recognition.start()
      ;(window as any)._recognition = recognition
    } else {
      setTimeout(() => {
        onTranscript(
          "Ko'chada katta muammo bor, tezda hal qilish kerak. Aholining ko'p qatlamiga ta'sir qilmoqda."
        )
        stopRecording()
      }, 4000)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
    const rec = (window as any)._recognition
    if (rec) {
      try {
        rec.stop()
      } catch (_) {}
    }
  }

  return { isRecording, recordingSeconds, startRecording, stopRecording }
}

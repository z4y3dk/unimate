import { useCallback, useRef, useState } from 'react'

export interface AudioMarker { offsetMs: number; lineIndex: number }

const DB_NAME = 'unimate-audio'
const STORE = 'recordings'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function dbPut(key: string, blob: Blob, markers: AudioMarker[]) {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ key, blob, markers })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function dbGet(key: string): Promise<{ blob: Blob; markers: AudioMarker[] } | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function dbDelete(key: string) {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function dbHas(key: string): Promise<boolean> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getKey(key)
    req.onsuccess = () => resolve(req.result !== undefined)
    req.onerror = () => reject(req.error)
  })
}

export function useNoteAudio(audioKey: string) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const markersRef = useRef<AudioMarker[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objUrlRef = useRef<string | null>(null)

  const checkHasRecording = useCallback(async () => {
    const has = await dbHas(audioKey).catch(() => false)
    setHasRecording(has)
  }, [audioKey])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      markersRef.current = []
      startTimeRef.current = Date.now()
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(250)
      mediaRecorderRef.current = mr
      setIsRecording(true)
      setElapsedMs(0)
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 500)
    } catch {
      alert('Microphone access denied. Please allow microphone access to record audio.')
    }
  }, [])

  const addMarker = useCallback((lineIndex: number) => {
    if (!isRecording) return
    markersRef.current.push({ offsetMs: Date.now() - startTimeRef.current, lineIndex })
  }, [isRecording])

  const stopRecording = useCallback(async () => {
    const mr = mediaRecorderRef.current
    if (!mr) return
    mr.stream.getTracks().forEach(t => t.stop())
    await new Promise<void>(resolve => { mr.onstop = () => resolve(); mr.stop() })
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    await dbPut(audioKey, blob, markersRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
    setElapsedMs(0)
    setHasRecording(true)
  }, [audioKey])

  const playRecording = useCallback(async () => {
    const record = await dbGet(audioKey)
    if (!record) return
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
    const url = URL.createObjectURL(record.blob)
    objUrlRef.current = url
    const audio = new Audio(url)
    audioRef.current = audio
    audio.ontimeupdate = () => {
      const ms = audio.currentTime * 1000
      const marker = record.markers.reduce((best, m) =>
        Math.abs(m.offsetMs - ms) < Math.abs(best.offsetMs - ms) ? m : best,
        record.markers[0] ?? { offsetMs: 0, lineIndex: 0 }
      )
      if (marker) setHighlightedLine(marker.lineIndex)
    }
    audio.onended = () => { setIsPlaying(false); setHighlightedLine(null) }
    audio.play()
    setIsPlaying(true)
  }, [audioKey])

  const pauseRecording = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const deleteRecording = useCallback(async () => {
    await dbDelete(audioKey)
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
    audioRef.current?.pause()
    setHasRecording(false)
    setIsPlaying(false)
    setHighlightedLine(null)
  }, [audioKey])

  const formatElapsed = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  return {
    isRecording, isPlaying, hasRecording, elapsedMs,
    highlightedLine, formatElapsed,
    checkHasRecording, startRecording, stopRecording,
    playRecording, pauseRecording, deleteRecording, addMarker,
  }
}

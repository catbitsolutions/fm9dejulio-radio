'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ==================== CONSTANTES ====================
const STREAM_URL = 'https://streaming01.radiosenlinea.com.ar/9622/stream'
const RADIO_URL = 'https://app.fm9dejulio.com.ar'
const SHARE_TEXT = '¡Escucha FM 9 de Julio 102.3 MHz en vivo! La radio verdad, la radio solidaria.'

// Colores base
const COLORS_DARK = {
  primary: '#DAA520',
  primaryBright: '#FFD700',
  accent: '#C9A227',
  bg: '#0d0d0d',
  text: '#ffffff',
  textMuted: '#b0b0b0',
}

const COLORS_LIGHT = {
  primary: '#DAA520',
  primaryBright: '#FFD700',
  accent: '#C9A227',
  bg: '#f5f5f5',
  text: '#1a1a1a',
  textMuted: '#666666',
}

// Temas
const THEMES = [
  { name: 'Dorado', primary: '#DAA520', accent: '#FFD700', bg: '#0d0d0d' },
  { name: 'Azul', primary: '#1E90FF', accent: '#00BFFF', bg: '#0a1628' },
  { name: 'Rosa', primary: '#FF69B4', accent: '#FF1493', bg: '#1a0a12' },
  { name: 'Verde', primary: '#32CD32', accent: '#00FF7F', bg: '#0a1a0a' },
  { name: 'Púrpura', primary: '#9370DB', accent: '#8A2BE2', bg: '#140a1a' },
]

// Modos de visualizador
const VISUALIZER_MODES = [
  { name: 'Desactivado', icon: '⊘' },
  { name: 'Barras', icon: '▮' },
  { name: 'Circular', icon: '◎' },
  { name: 'Onda', icon: '∿' },
  { name: 'Puntos', icon: '•' },
  { name: 'Simétrico', icon: '⫿' },
  { name: 'Estéreo L/R', icon: '∡' },
  { name: 'Estéreo Dual', icon: '⇿' },
  { name: 'Partículas', icon: '✦' },
  { name: 'Espectrograma', icon: '▒' },
  { name: '3D Tunnel', icon: '◈' },
  { name: 'Fiesta', icon: '🌈' },
  { name: 'Osciloscopio', icon: '📊' },
]

// Logros
const ACHIEVEMENTS = [
  { id: 'first', name: '🎵 Primera vez', check: (m: number) => m >= 1 },
  { id: 'hour', name: '⏰ Una hora', check: (m: number) => m >= 60 },
  { id: 'fan', name: '🎧 Fanático', check: (m: number) => m >= 300 },
  { id: 'streak3', name: '🔥 Constancia', check: (_: number, s: number) => s >= 3 },
  { id: 'streak7', name: '🏆 Semanal', check: (_: number, s: number) => s >= 7 },
]

// Opciones de compartir
const SHARE_OPTIONS = [
  { name: 'WhatsApp', icon: '📱', color: '#25D366', url: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}` },
  { name: 'Facebook', icon: '📘', color: '#1877F2', url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { name: 'Instagram', icon: '📸', color: '#E4405F', url: (u: string, t: string) => `https://www.instagram.com/create/story/?background_image=${encodeURIComponent(u)}&caption=${encodeURIComponent(t)}` },
  { name: 'X (Twitter)', icon: '𝕏', color: '#000000', url: (u: string, t: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { name: 'Telegram', icon: '✈️', color: '#0088cc', url: (u: string, t: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { name: 'Email', icon: '✉️', color: '#EA4335', url: (u: string, t: string) => `mailto:?subject=${encodeURIComponent('FM 9 de Julio')}&body=${encodeURIComponent(t + '\n' + u)}` },
  { name: 'Copiar URL', icon: '📋', color: '#6B7280', action: 'copy' },
]

// ==================== INTERFACES ====================
interface Stats {
  totalMinutes: number
  streak: number
  lastDate: string
  todayMinutes: number
  achievements: string[]
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function Home() {
  // --- Refs de audio ---
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const analyserLRef = useRef<AnalyserNode | null>(null)
  const analyserRRef = useRef<AnalyserNode | null>(null)
  
  // --- Refs de control ---
  const playRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const pauseRef = useRef<() => void>(() => {})
  const animRef = useRef<number>(0)
  const animFsRef = useRef<number>(0)
  const modeRef = useRef(1)
  const modeFsRef = useRef(1)
  const listenRef = useRef(0)
  const reconnectRef = useRef<NodeJS.Timeout | null>(null)
  const wasPlayingRef = useRef(false)
  const isReconnectingRef = useRef(false)
  const firstTouchRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, size: number, alpha: number}>>([])
  const fiestaHueRef = useRef(0)
  
  // --- Refs canvas ---
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasFsRef = useRef<HTMLCanvasElement>(null)
  
  // --- Estado ---
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('Toca para reproducir')
  const [volume, setVolume] = useState(1)
  const [mode, setMode] = useState(1)
  const [dark, setDark] = useState(true)
  const [themeIdx, setThemeIdx] = useState(0)
  const [showFs, setShowFs] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [sleepTimer, setSleepTimer] = useState<number | null>(null)
  const [sleepDisplay, setSleepDisplay] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(false)
  const [installEvent, setInstallEvent] = useState<Event | null>(null)
  const [installable, setInstallable] = useState(false)
  const [weather, setWeather] = useState<{t: number, icon: string} | null>(null)
  const [stats, setStats] = useState<Stats>({ totalMinutes: 0, streak: 0, lastDate: '', todayMinutes: 0, achievements: [] })
  
  // --- Colores actuales ---
  const theme = THEMES[themeIdx]
  const colors = dark ? { ...COLORS_DARK, primary: theme.primary, primaryBright: theme.accent, bg: theme.bg } : COLORS_LIGHT

  // ==================== EFECTOS DE INICIALIZACIÓN ====================
  useEffect(() => {
    const saved = localStorage.getItem('fm9_stats')
    const savedDark = localStorage.getItem('fm9_dark')
    const savedTheme = localStorage.getItem('fm9_theme')
    requestAnimationFrame(() => {
      if (saved) setStats(JSON.parse(saved))
      if (savedDark) setDark(savedDark === 'true')
      if (savedTheme) setThemeIdx(parseInt(savedTheme) || 0)
      setOffline(!navigator.onLine)
    })
  }, [])

  useEffect(() => {
    localStorage.setItem('fm9_stats', JSON.stringify(stats))
  }, [stats])

  // ==================== CLIMA ====================
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-26.35&longitude=-60.43&current_weather=true&timezone=America/Argentina/Buenos_Aires')
        const data = await res.json()
        if (data.current_weather) {
          const code = data.current_weather.weathercode
          const icon = code <= 3 ? '☀️' : code <= 49 ? '☁️' : code <= 69 ? '🌧️' : code <= 79 ? '❄️' : '⛈️'
          setWeather({ t: Math.round(data.current_weather.temperature), icon })
        }
      } catch { /* silencioso */ }
    }
    fetchWeather()
    const iv = setInterval(fetchWeather, 1800000)
    return () => clearInterval(iv)
  }, [])

  // ==================== STATS DE ESCUCHA ====================
  useEffect(() => {
    if (!isPlaying) return
    const iv = setInterval(() => {
      listenRef.current++
      if (listenRef.current >= 60) {
        listenRef.current = 0
        const now = new Date()
        const today = now.toDateString()
        setStats(prev => {
          const newStats = { ...prev, totalMinutes: prev.totalMinutes + 1, todayMinutes: prev.todayMinutes + 1 }
          if (prev.lastDate !== today) {
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            newStats.streak = prev.lastDate === yesterday.toDateString() ? prev.streak + 1 : 1
            newStats.lastDate = today
          }
          ACHIEVEMENTS.forEach(a => {
            if (!newStats.achievements.includes(a.id) && a.check(newStats.totalMinutes, newStats.streak)) {
              newStats.achievements.push(a.id)
            }
          })
          return newStats
        })
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [isPlaying])

  // ==================== EVENTOS ONLINE/OFFLINE ====================
  useEffect(() => {
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  // ==================== PWA INSTALL ====================
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallEvent(e); setInstallable(true); setTimeout(() => { if (!localStorage.getItem('fm9_install_dismissed')) setInstallPrompt(true) }, 5000) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const installApp = async () => {
    if (!installEvent) return
    // @ts-expect-error PWA API
    installEvent.prompt()
    // @ts-expect-error PWA API
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') { setInstallPrompt(false); setInstallable(false) }
    setInstallEvent(null)
  }

  // ==================== AUDIO CONTEXT ====================
  const initAudio = useCallback(() => {
    if (!audioRef.current || audioCtxRef.current) return
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.6
      analyserRef.current = analyser
      const analyserL = ctx.createAnalyser()
      analyserL.fftSize = 128
      analyserL.smoothingTimeConstant = 0.6
      analyserLRef.current = analyserL
      const analyserR = ctx.createAnalyser()
      analyserR.fftSize = 128
      analyserR.smoothingTimeConstant = 0.6
      analyserRRef.current = analyserR
      const source = ctx.createMediaElementSource(audioRef.current)
      const splitter = ctx.createChannelSplitter(2)
      const merger = ctx.createChannelMerger(2)
      source.connect(analyser)
      source.connect(splitter)
      splitter.connect(analyserL, 0)
      splitter.connect(analyserR, 1)
      analyserL.connect(merger, 0, 0)
      analyserR.connect(merger, 0, 1)
      merger.connect(ctx.destination)
    } catch { /* silencioso */ }
  }, [])

  // ==================== CONTROLES DE REPRODUCCIÓN ====================
  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    setIsLoading(true)
    setStatus('Conectando...')
    wasPlayingRef.current = true
    isReconnectingRef.current = false
    try {
      if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume()
      audio.src = STREAM_URL
      audio.load()
      await audio.play()
      if (!audioCtxRef.current) initAudio()
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: 'FM 9 de Julio 102.3 MHz', artist: 'Tres Isletas, Chaco', album: 'Radio en vivo' })
        navigator.mediaSession.playbackState = 'playing'
      }
      setIsPlaying(true)
      setIsLoading(false)
      setStatus('En vivo')
    } catch {
      setIsPlaying(false)
      setIsLoading(false)
      setStatus('Toca para reproducir')
    }
  }, [initAudio])

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    wasPlayingRef.current = false
    isReconnectingRef.current = false
    if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null }
    audio.pause()
    setIsPlaying(false)
    setStatus('Pausado')
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
  }, [])

  useEffect(() => { playRef.current = play; pauseRef.current = pause }, [play, pause])

  // ==================== EVENTOS DE AUDIO ====================
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => { if (!audioCtxRef.current) initAudio(); isReconnectingRef.current = false; setIsPlaying(true); setIsLoading(false); setStatus('En vivo'); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing' }
    const onWait = () => { setIsLoading(true); setStatus('Cargando...') }
    const onCanPlay = () => setIsLoading(false)
    const onError = () => {
      if (isReconnectingRef.current) return
      if (!wasPlayingRef.current) { setIsPlaying(false); setIsLoading(false); setStatus('Error - Toca para reintentar'); return }
      setIsPlaying(false); setStatus('Reconectando...'); setIsLoading(true); isReconnectingRef.current = true
      reconnectRef.current = setTimeout(() => {
        if (wasPlayingRef.current && audio) {
          audio.src = STREAM_URL + '?t=' + Date.now()
          audio.load()
          audio.play().catch(() => { isReconnectingRef.current = false; setStatus('Sin conexión'); setIsLoading(false) })
        }
      }, 3000)
    }
    audio.addEventListener('playing', onPlay)
    audio.addEventListener('waiting', onWait)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('error', onError)
    return () => { audio.removeEventListener('playing', onPlay); audio.removeEventListener('waiting', onWait); audio.removeEventListener('canplay', onCanPlay); audio.removeEventListener('error', onError) }
  }, [initAudio])

  // ==================== RECONEXIÓN ONLINE ====================
  useEffect(() => {
    const onOnline = () => {
      const audio = audioRef.current
      if (wasPlayingRef.current && !isReconnectingRef.current && audio?.paused) {
        setStatus('Reconectando...'); setIsLoading(true); isReconnectingRef.current = true
        audio.src = STREAM_URL + '?t=' + Date.now()
        audio.load()
        audio.play().catch(() => { isReconnectingRef.current = false; setStatus('Error'); setIsLoading(false) })
      }
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // ==================== AUTOPLAY ====================
  useEffect(() => {
    const t = setTimeout(() => { playRef.current().catch(() => { setStatus('Toca para reproducir'); setIsLoading(false) }) }, 500)
    const onTouch = () => {
      if (firstTouchRef.current) return
      firstTouchRef.current = true
      if (!isPlaying && !isLoading) { setStatus('Conectando...'); setIsLoading(true); playRef.current().catch(() => { setStatus('Error'); setIsLoading(false) }) }
    }
    document.addEventListener('touchstart', onTouch, { once: true })
    document.addEventListener('click', onTouch, { once: true })
    return () => { clearTimeout(t); document.removeEventListener('touchstart', onTouch); document.removeEventListener('click', onTouch) }
  }, [isPlaying, isLoading])

  // ==================== VOLUMEN ====================
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume }, [volume])

  // ==================== SLEEP TIMER ====================
  const setSleep = useCallback((mins: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSleepTimer(mins)
    setShowTimer(false)
    if (mins > 0) {
      const end = Date.now() + mins * 60000
      const update = () => {
        const rem = Math.max(0, end - Date.now())
        if (rem <= 0) { pauseRef.current(); setSleepTimer(null); setSleepDisplay(null); return }
        setSleepDisplay(`${Math.floor(rem / 60000)}:${Math.floor((rem % 60000) / 1000).toString().padStart(2, '0')}`)
        timerRef.current = setTimeout(update, 1000)
      }
      update()
    } else setSleepDisplay(null)
  }, [])

  // ==================== VISUALIZADOR ====================
  const drawVis = useCallback((canvas: HTMLCanvasElement, fullscreen = false) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width, height } = canvas
    const cx = width / 2, cy = height / 2
    const m = fullscreen ? modeFsRef.current : modeRef.current
    const analyser = analyserRef.current
    ctx.clearRect(0, 0, width, height)
    
    if (m === 0) {
      ctx.fillStyle = colors.textMuted
      ctx.font = fullscreen ? '24px sans-serif' : '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Visualizador desactivado', cx, cy)
      return
    }
    
    if (!analyser) {
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `${colors.primary}30`
        ctx.fillRect((width / 40) * i, height - 3, width / 40 - 2, 3)
      }
      return
    }
    
    const bufLen = analyser.frequencyBinCount
    const data = new Uint8Array(bufLen)
    analyser.getByteFrequencyData(data)
    const grad = ctx.createLinearGradient(0, height, 0, 0)
    grad.addColorStop(0, colors.primary)
    grad.addColorStop(0.5, colors.primaryBright)
    grad.addColorStop(1, colors.accent)
    
    // Modos
    if (m === 1) { // Barras
      const bw = width / bufLen
      for (let i = 0; i < bufLen; i++) {
        const h = (data[i] / 255) * height * 0.9
        if (h > 1) { ctx.fillStyle = grad; ctx.fillRect(i * bw, height - h, bw - 1, h) }
      }
    } else if (m === 2) { // Circular
      const r = Math.min(width, height) * 0.35
      for (let i = 0; i < bufLen; i++) {
        const angle = (i / bufLen) * Math.PI * 2
        const h = (data[i] / 255) * r * 0.8
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * r * 0.5, cy + Math.sin(angle) * r * 0.5)
        ctx.lineTo(cx + Math.cos(angle) * (r * 0.5 + h), cy + Math.sin(angle) * (r * 0.5 + h))
        ctx.strokeStyle = grad
        ctx.lineWidth = 2
        ctx.stroke()
      }
    } else if (m === 3) { // Onda
      ctx.beginPath()
      ctx.moveTo(0, cy)
      for (let i = 0; i < bufLen; i++) ctx.lineTo((i / bufLen) * width, cy + ((data[i] / 255) - 0.5) * height * 0.8)
      ctx.strokeStyle = grad
      ctx.lineWidth = 3
      ctx.stroke()
    } else if (m === 4) { // Puntos
      const sp = width / 30
      for (let i = 0; i < 30; i++) {
        const di = Math.floor((i / 30) * bufLen)
        const r = Math.max(2, (data[di] / 255) * 15)
        ctx.beginPath()
        ctx.arc(sp * i + sp / 2, cy + ((data[di] / 255) - 0.5) * height * 0.7, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }
    } else if (m === 5) { // Simétrico
      const bw = width / 40
      for (let i = 0; i < 40; i++) {
        const h = (data[Math.floor((i / 40) * bufLen)] / 255) * height * 0.4
        if (h > 1) { ctx.fillStyle = grad; ctx.fillRect(i * bw, cy - h, bw - 2, h); ctx.fillRect(i * bw, cy, bw - 2, h) }
      }
    } else if (m === 6 || m === 7) { // Estéreo
      const aL = analyserLRef.current, aR = analyserRRef.current
      if (aL && aR) {
        const dL = new Uint8Array(aL.frequencyBinCount), dR = new Uint8Array(aR.frequencyBinCount)
        aL.getByteFrequencyData(dL); aR.getByteFrequencyData(dR)
        if (m === 6) {
          const hw = width / 2, bw = hw / dL.length
          for (let i = 0; i < dL.length; i++) { const h = (dL[i] / 255) * height * 0.85; ctx.fillStyle = '#00CED1'; ctx.fillRect(hw - (i + 1) * bw, height - h, bw - 1, h) }
          for (let i = 0; i < dR.length; i++) { const h = (dR[i] / 255) * height * 0.85; ctx.fillStyle = '#FFD700'; ctx.fillRect(hw + i * bw, height - h, bw - 1, h) }
        } else {
          const bw = width / dL.length, hh = height / 2
          for (let i = 0; i < dL.length; i++) { const h = (dL[i] / 255) * hh * 0.9; ctx.fillStyle = '#00CED1'; ctx.fillRect(i * bw, hh - h, bw - 1, h) }
          for (let i = 0; i < dR.length; i++) { const h = (dR[i] / 255) * hh * 0.9; ctx.fillStyle = '#FFD700'; ctx.fillRect(i * bw, hh, bw - 1, h) }
        }
      }
    } else if (m === 8) { // Partículas
      const avg = data.reduce((a, b) => a + b, 0) / bufLen, int = avg / 255
      if (int > 0.1) for (let i = 0; i < Math.floor(int * 5); i++) particlesRef.current.push({ x: cx + (Math.random() - 0.5) * 100, y: cy, vx: (Math.random() - 0.5) * 4 * int, vy: (Math.random() - 0.5) * 4 * int - 2, size: Math.random() * 4 + 2, alpha: 1 })
      particlesRef.current = particlesRef.current.filter(p => { p.x += p.vx; p.y += p.vy; p.alpha -= 0.02; if (p.alpha > 0 && p.size > 0.5) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(218, 165, 32, ${p.alpha})`; ctx.fill(); return true } return false })
      if (particlesRef.current.length > 200) particlesRef.current = particlesRef.current.slice(-200)
    } else if (m === 9) { // Espectrograma
      const bw = width / bufLen
      for (let i = 0; i < bufLen; i++) { const v = data[i] / 255; ctx.fillStyle = `hsl(${(i / bufLen) * 60 + 30}, 80%, ${20 + v * 60}%)`; ctx.fillRect(i * bw, 0, bw - 1, height) }
    } else if (m === 10) { // 3D Tunnel
      const t = Date.now() / 1000, avg = data.reduce((a, b) => a + b, 0) / bufLen, int = avg / 255, maxR = Math.min(width, height) * 0.45
      for (let i = 15; i >= 0; i--) {
        const p = i / 15, z = (p + t * 0.5) % 1, r = maxR * z, a = 1 - z, fv = data[Math.floor(p * bufLen)] / 255, rot = t + fv * 0.5
        ctx.beginPath()
        for (let j = 0; j <= 8; j++) { const ang = (j / 8) * Math.PI * 2 + rot, w = 1 + fv * 0.3; if (j === 0) ctx.moveTo(cx + Math.cos(ang) * r * w, cy + Math.sin(ang) * r * w); else ctx.lineTo(cx + Math.cos(ang) * r * w, cy + Math.sin(ang) * r * w) }
        ctx.closePath()
        ctx.strokeStyle = `hsla(40, 80%, ${50 + a * 30}%, ${a * int * 2})`
        ctx.lineWidth = 2 + fv * 3
        ctx.stroke()
      }
    } else if (m === 11) { // Fiesta
      fiestaHueRef.current = (fiestaHueRef.current + 2) % 360
      const avg = data.reduce((a, b) => a + b, 0) / bufLen, int = avg / 255
      const bg = ctx.createLinearGradient(0, 0, width, height)
      bg.addColorStop(0, `hsla(${fiestaHueRef.current}, 70%, 10%, 0.3)`)
      bg.addColorStop(0.5, `hsla(${(fiestaHueRef.current + 60) % 360}, 70%, 15%, 0.3)`)
      bg.addColorStop(1, `hsla(${(fiestaHueRef.current + 120) % 360}, 70%, 10%, 0.3)`)
      ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height)
      const bw = width / bufLen
      for (let i = 0; i < bufLen; i++) {
        const h = (data[i] / 255) * height * 0.9, hue = (fiestaHueRef.current + (i / bufLen) * 180) % 360
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.7 + int * 0.3})`; ctx.fillRect(i * bw, height - h, bw - 1, h)
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`; ctx.fillRect(i * bw, 0, bw - 1, h * 0.3)
      }
      if (int > 0.5) for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 10 * int, 0, Math.PI * 2); ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 70%, ${Math.random()})`; ctx.fill() }
    } else if (m === 12) { // Osciloscopio
      ctx.fillStyle = '#0a1a0a'; ctx.fillRect(0, 0, width, height)
      ctx.strokeStyle = '#1a3a1a'; ctx.lineWidth = 1
      for (let i = 0; i < width; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke() }
      for (let i = 0; i < height; i += 15) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke() }
      ctx.strokeStyle = '#2a4a2a'; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke()
      const timeData = new Uint8Array(analyser.fftSize)
      analyser.getByteTimeDomainData(timeData)
      ctx.beginPath(); ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 2; ctx.shadowColor = '#00FF00'; ctx.shadowBlur = 10
      let x = 0
      for (let i = 0; i < timeData.length; i++) { const v = timeData[i] / 128.0; if (i === 0) ctx.moveTo(x, v * cy); else ctx.lineTo(x, v * cy); x += width / timeData.length }
      ctx.stroke(); ctx.shadowBlur = 0
      ctx.font = '10px monospace'; ctx.fillStyle = '#00FF00'; ctx.fillText('FM 9 de JULIO - 102.3 MHz', 5, 12)
    }
  }, [colors])

  // ==================== ANIMACIÓN ====================
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const animate = () => { animRef.current = requestAnimationFrame(animate); drawVis(canvas, false) }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [drawVis])

  useEffect(() => {
    if (!showFs) return
    const canvas = canvasFsRef.current
    if (!canvas) return
    const animate = () => { animFsRef.current = requestAnimationFrame(animate); drawVis(canvas, true) }
    animate()
    return () => cancelAnimationFrame(animFsRef.current)
  }, [showFs, drawVis])

  // ==================== KEYBOARD ====================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (isPlaying) { pause() } else { play() }
      } else if (e.code === 'KeyF') {
        setShowFs(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPlaying, play, pause])

  // ==================== CLEANUP ====================
  useEffect(() => {
    return () => { if (audioCtxRef.current) audioCtxRef.current.close(); if (reconnectRef.current) clearTimeout(reconnectRef.current); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // ==================== HELPERS ====================
  const cycleMode = useCallback(() => {
    const newMode = modeRef.current >= 12 ? 0 : modeRef.current + 1
    modeRef.current = newMode
    modeFsRef.current = newMode
    setMode(newMode)
  }, [])

  const toggleDark = useCallback(() => { const n = !dark; setDark(n); localStorage.setItem('fm9_dark', String(n)) }, [dark])
  const cycleTheme = useCallback(() => { const n = (themeIdx + 1) % THEMES.length; setThemeIdx(n); localStorage.setItem('fm9_theme', String(n)) }, [themeIdx])
  
  const copyUrl = async () => {
    await navigator.clipboard.writeText(RADIO_URL)
    alert('¡URL copiada!')
    setShowShare(false)
  }

  const openShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400')
    setShowShare(false)
  }

  // ==================== RENDER ====================
  return (
    <div style={{ minHeight: '100dvh', width: '100%', background: dark ? `linear-gradient(180deg, ${colors.bg} 0%, #1a1a1a 50%, ${colors.bg} 100%)` : colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', position: 'fixed', inset: 0, overflow: 'hidden', color: colors.text }}>
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" playsInline style={{ display: 'none' }} />
      
      {/* Offline */}
      {offline && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#dc2626', color: 'white', padding: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', zIndex: 1000 }}>📡 Sin conexión</div>}
      
      {/* Install Prompt */}
      {installPrompt && installable && (
        <div style={{ position: 'fixed', top: offline ? '28px' : '8px', left: '8px', right: '8px', background: colors.primary, color: colors.bg, padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div><div style={{ fontWeight: 'bold', fontSize: '12px' }}>📲 Instalar App</div><div style={{ fontSize: '10px', opacity: 0.8 }}>Agregá FM 9 a tu pantalla</div></div>
          <button onClick={installApp} style={{ background: colors.bg, color: colors.primary, border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Instalar</button>
          <button onClick={() => { setInstallPrompt(false); localStorage.setItem('fm9_install_dismissed', 'true') }} style={{ background: 'transparent', border: 'none', color: colors.bg, fontSize: '16px', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', paddingTop: installPrompt ? '55px' : '0' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={toggleDark} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>{dark ? '☀️' : '🌙'}</button>
            <button onClick={cycleTheme} style={{ background: theme.primary, border: 'none', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '10px' }}>🎨</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '15px' }}>
            {weather ? <><span style={{ fontSize: '14px' }}>{weather.icon}</span><span style={{ fontSize: '12px', fontWeight: '500' }}>{weather.t}°</span></> : <span style={{ fontSize: '11px' }}>🌤️ --°</span>}
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => setShowStats(s => !s)} style={{ background: 'transparent', border: `1px solid ${colors.primary}`, borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: colors.text }}>📊</button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowTimer(t => !t)} style={{ background: sleepTimer ? colors.primary : 'transparent', color: sleepTimer ? colors.bg : colors.textMuted, border: `1px solid ${colors.primary}`, borderRadius: '6px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}>⏰ {sleepDisplay || 'Timer'}</button>
              {showTimer && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: colors.bg, border: `1px solid ${colors.primary}`, borderRadius: '6px', padding: '6px', zIndex: 100, minWidth: '100px' }}>
                  {[15, 30, 45, 60, 90].map(m => <button key={m} onClick={() => setSleep(m)} style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', color: colors.text, padding: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '11px' }}>{m} min</button>)}
                  <button onClick={() => setSleep(0)} style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', color: colors.primary, padding: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '11px' }}>Cancelar</button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Logo */}
        <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${colors.primary}`, boxShadow: isPlaying ? `0 0 25px ${colors.primary}80, 0 0 50px ${colors.primary}40` : `0 0 10px ${colors.primary}30`, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
          <img src="https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=955&ssl=1" alt="FM 9 de Julio" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '8px 0 2px 0', textShadow: `0 2px 8px ${colors.primary}50`, textAlign: 'center' }}>FM 9 de Julio</h1>
        <p style={{ fontSize: '14px', color: colors.primary, margin: 0, fontWeight: '600' }}>102.3 MHz</p>
        <p style={{ fontSize: '11px', color: colors.textMuted, margin: '2px 0 0 0' }}>Tres Isletas, Chaco</p>
      </div>
      
      {/* Stats */}
      {showStats && (
        <div style={{ width: '100%', maxWidth: '320px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px', marginBottom: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>{stats.todayMinutes} min</div><div style={{ fontSize: '9px', color: colors.textMuted }}>Hoy</div></div>
            <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</div><div style={{ fontSize: '9px', color: colors.textMuted }}>Total</div></div>
            <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>🔥 {stats.streak}</div><div style={{ fontSize: '9px', color: colors.textMuted }}>Racha</div></div>
          </div>
          {stats.achievements.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>{stats.achievements.map(id => ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean).map(a => <span key={a!.id} style={{ fontSize: '16px' }} title={a!.name}>{a!.name.split(' ')[0]}</span>)}</div>}
        </div>
      )}
      
      {/* Visualizador */}
      <div onClick={cycleMode} style={{ width: '100%', maxWidth: '320px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', border: `1px solid ${colors.primary}40`, cursor: 'pointer', position: 'relative' }}>
        <canvas ref={canvasRef} width={320} height={50} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: '2px', right: '5px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '6px', fontSize: '8px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '3px' }}><span>{VISUALIZER_MODES[mode].icon}</span><span>{VISUALIZER_MODES[mode].name}</span></div>
        <button onClick={e => { e.stopPropagation(); setShowFs(true) }} style={{ position: 'absolute', top: '2px', right: '5px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', fontSize: '10px' }}>⛶</button>
      </div>
      
      {/* Estado y Play */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '12px', background: isPlaying ? 'rgba(218, 165, 32, 0.25)' : 'rgba(255,255,255,0.1)', border: `1px solid ${isPlaying ? colors.primary : 'rgba(255,255,255,0.2)'}`, marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPlaying ? '#4ade80' : colors.textMuted, animation: isPlaying ? 'blink 1s infinite' : 'none' }} />
          <span style={{ fontSize: '11px', fontWeight: '500' }}>{status}</span>
        </div>
        <button onClick={() => isPlaying ? pause() : play()} disabled={isLoading} style={{ width: '65px', height: '65px', borderRadius: '50%', border: 'none', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`, cursor: isLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 25px ${colors.primary}50` }}>
          {isLoading ? <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : isPlaying ? <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg> : <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>}
        </button>
      </div>
      
      {/* Volumen */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 15px', background: dark ? 'rgba(218, 165, 32, 0.1)' : 'rgba(218, 165, 32, 0.15)', borderRadius: '20px', border: `1px solid ${colors.primary}30`, width: '100%', maxWidth: '260px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill={colors.primary}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ flex: 1, height: '5px', appearance: 'none', background: `linear-gradient(to right, ${colors.primary} ${volume * 100}%, ${colors.primary}30 ${volume * 100}%)`, borderRadius: '3px', cursor: 'pointer', outline: 'none' }} />
        <span style={{ color: colors.primary, fontSize: '11px', fontWeight: 'bold', minWidth: '30px' }}>{Math.round(volume * 100)}%</span>
      </div>
      
      {/* Botones */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '12px', flex: '0 0 auto', padding: '5px 0' }}>
        <button onClick={() => window.open(`https://wa.me/543644503323?text=${encodeURIComponent('🎤 Quiero enviar un saludo por FM 9 de Julio!\n\n')}`, '_blank')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '0', width: '52px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(236, 72, 153, 0.4)' }}>💌</div>
          <span style={{ color: colors.textMuted, fontSize: '9px' }}>Saludo</span>
        </button>
        <a href="https://wa.me/543644503323" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', width: '52px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(37, 211, 102, 0.4)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
          <span style={{ color: colors.textMuted, fontSize: '9px' }}>WhatsApp</span>
        </a>
        <a href="https://www.facebook.com/fm9dejuliotresisletas" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', width: '52px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(24, 119, 242, 0.4)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>
          <span style={{ color: colors.textMuted, fontSize: '9px' }}>Facebook</span>
        </a>
        <button onClick={() => setShowShare(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '0', width: '52px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${colors.primary}40` }}><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg></div>
          <span style={{ color: colors.textMuted, fontSize: '9px' }}>Compartir</span>
        </button>
        <a href="https://play.google.com/store/apps/details?id=com.radioshd.fm9dejulio" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', width: '52px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #00C4FF 0%, #7B2FFF 50%, #F50057 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(123, 47, 255, 0.4)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg></div>
          <span style={{ color: colors.textMuted, fontSize: '9px' }}>App</span>
        </a>
      </div>
      
      {/* Créditos */}
      <div style={{ textAlign: 'center', flex: '0 0 auto', paddingBottom: 'env(safe-area-inset-bottom, 5px)' }}>
        <p style={{ color: colors.primary, fontSize: '9px', fontStyle: 'italic', margin: '0 0 2px 0' }}>"La radio verdad... La radio solidaria..."</p>
        <span style={{ color: colors.textMuted, fontSize: '8px' }}>Diseñado por <a href="https://wa.me/543644536161" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none' }}>Davincho</a></span>
      </div>
      
      {/* Modal Compartir */}
      {showShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowShare(false)}>
          <div style={{ background: colors.bg, borderRadius: '20px 20px 0 0', padding: '20px', width: '100%', maxWidth: '400px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'center', color: colors.text }}>Compartir</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              {SHARE_OPTIONS.map(opt => (
                <button key={opt.name} onClick={() => opt.action === 'copy' ? copyUrl() : openShare(opt.url(RADIO_URL, SHARE_TEXT))} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{opt.icon}</div>
                  <span style={{ color: colors.textMuted, fontSize: '11px' }}>{opt.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowShare(false)} style={{ width: '100%', marginTop: '15px', padding: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', color: colors.text, fontSize: '14px', cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}
      
      {/* Fullscreen Modal */}
      {showFs && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <canvas ref={canvasFsRef} width={typeof window !== 'undefined' ? window.innerWidth : 400} height={typeof window !== 'undefined' ? window.innerHeight : 800} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
          <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, textAlign: 'center', color: colors.text, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '22px', margin: 0, color: colors.primary }}>FM 9 de Julio</h2>
            <p style={{ fontSize: '12px', margin: '3px 0', color: colors.textMuted }}>102.3 MHz - Tres Isletas, Chaco</p>
          </div>
          <button onClick={() => setShowFs(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer', color: colors.text }}>✕</button>
          <button onClick={cycleMode} style={{ position: 'absolute', bottom: '25px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '15px', padding: '8px 15px', color: colors.text, fontSize: '12px', cursor: 'pointer' }}>{VISUALIZER_MODES[mode].icon} {VISUALIZER_MODES[mode].name}</button>
        </div>
      )}
      
      {/* Animaciones CSS */}
      <style jsx global>{`
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 25px ${colors.primary}50, 0 0 50px ${colors.primary}30; transform: scale(1); } 50% { box-shadow: 0 0 40px ${colors.primary}80, 0 0 70px ${colors.primary}50; transform: scale(1.02); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { margin: 0; padding: 0; overflow: hidden; position: fixed; width: 100%; height: 100%; user-select: none; -webkit-user-select: none; overscroll-behavior: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${colors.primary}; cursor: pointer; box-shadow: 0 0 6px ${colors.primary}80; border: 2px solid ${colors.primaryBright}; }
        input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${colors.primary}; cursor: pointer; box-shadow: 0 0 6px ${colors.primary}80; border: 2px solid ${colors.primaryBright}; }
      `}</style>
    </div>
  )
}

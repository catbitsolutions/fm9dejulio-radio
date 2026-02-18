'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// Colores - Amarillo oscuro/dorado
const COLORS = {
  primary: '#DAA520',
  primaryBright: '#FFD700',
  secondary: '#B8860B',
  dark: '#1a1a1a',
  darker: '#0d0d0d',
  accent: '#C9A227',
  text: '#ffffff',
  textMuted: '#b0b0b0',
}

// Colores modo claro
const COLORS_LIGHT = {
  primary: '#DAA520',
  primaryBright: '#FFD700',
  secondary: '#B8860B',
  dark: '#ffffff',
  darker: '#f5f5f5',
  accent: '#C9A227',
  text: '#1a1a1a',
  textMuted: '#666666',
}

// Temas de colores
const THEMES = [
  { name: 'Dorado', primary: '#DAA520', accent: '#FFD700', bg: '#0d0d0d' },
  { name: 'Azul', primary: '#1E90FF', accent: '#00BFFF', bg: '#0a1628' },
  { name: 'Rosa', primary: '#FF69B4', accent: '#FF1493', bg: '#1a0a12' },
  { name: 'Verde', primary: '#32CD32', accent: '#00FF7F', bg: '#0a1a0a' },
  { name: 'Púrpura', primary: '#9370DB', accent: '#8A2BE2', bg: '#140a1a' },
]

// URL del streaming
const STREAM_URL = 'https://streaming01.radiosenlinea.com.ar/9622/stream'

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

// Programación de la radio
const PROGRAMMING = [
  { name: 'Madrugada Musical', start: 0, end: 6, days: [0,1,2,3,4,5,6] },
  { name: 'Buenos Días Tres Isletas', start: 6, end: 9, days: [0,1,2,3,4,5,6] },
  { name: 'Mañana FM', start: 9, end: 12, days: [0,1,2,3,4,5,6] },
  { name: 'Mediodía con FM 9', start: 12, end: 15, days: [0,1,2,3,4,5,6] },
  { name: 'Tarde FM', start: 15, end: 18, days: [0,1,2,3,4,5,6] },
  { name: 'Atardecer Musical', start: 18, end: 21, days: [0,1,2,3,4,5,6] },
  { name: 'Noche FM 9 de Julio', start: 21, end: 24, days: [0,1,2,3,4,5,6] },
]

// Logros
const ACHIEVEMENTS = [
  { id: 'first_listen', name: '🎵 Primera vez', desc: 'Escuchaste por primera vez', check: (stats: Stats) => stats.totalMinutes >= 1 },
  { id: 'hour', name: '⏰ Una hora', desc: 'Escuchaste 1 hora en total', check: (stats: Stats) => stats.totalMinutes >= 60 },
  { id: 'five_hours', name: '🎧 Fanático', desc: 'Escuchaste 5 horas en total', check: (stats: Stats) => stats.totalMinutes >= 300 },
  { id: 'streak_3', name: '🔥 Constancia', desc: '3 días seguidos escuchando', check: (stats: Stats) => stats.streak >= 3 },
  { id: 'streak_7', name: '🏆 Semanal', desc: '7 días seguidos escuchando', check: (stats: Stats) => stats.streak >= 7 },
  { id: 'night', name: '🌙 Nocturno', desc: 'Escuchaste después de las 12am', check: (stats: Stats) => stats.nightListener },
  { id: 'morning', name: '🌅 Madrugador', desc: 'Escuchaste antes de las 7am', check: (stats: Stats) => stats.morningListener },
]

interface Stats {
  totalMinutes: number
  streak: number
  lastListenDate: string
  todayMinutes: number
  nightListener: boolean
  morningListener: boolean
  achievements: string[]
}

// Coordenadas de Tres Isletas, Chaco
const TRES_ISLETAS_LAT = -26.35
const TRES_ISLETAS_LON = -60.43

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const fullscreenAnimationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const analyserLeftRef = useRef<AnalyserNode | null>(null)
  const analyserRightRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const playRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const pauseRef = useRef<() => void>(() => {})
  const visualizerModeRef = useRef<number>(1)
  const fullscreenModeRef = useRef<number>(1)
  const listenTimeRef = useRef<number>(0)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('Toca para reproducir')
  const [volume, setVolume] = useState(1)
  const [visualizerMode, setVisualizerMode] = useState(1)
  const [darkMode, setDarkMode] = useState(true)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [currentProgram, setCurrentProgram] = useState('')
  const [sleepTimer, setSleepTimer] = useState<number | null>(null)
  const [sleepTimerDisplay, setSleepTimerDisplay] = useState<string | null>(null)
  const [showSleepOptions, setShowSleepOptions] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [partyMode, setPartyMode] = useState(false)
  const [themeIndex, setThemeIndex] = useState(0)
  const [currentTheme, setCurrentTheme] = useState(THEMES[0])
  
  // Estadísticas
  const [stats, setStats] = useState<Stats>({
    totalMinutes: 0,
    streak: 0,
    lastListenDate: '',
    todayMinutes: 0,
    nightListener: false,
    morningListener: false,
    achievements: []
  })
  const [showStats, setShowStats] = useState(false)
  const [currentVolumeLevel, setCurrentVolumeLevel] = useState(0)
  
  // Clima
  const [weather, setWeather] = useState<{ temp: number; desc: string; icon: string } | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)

  // Colores dinámicos según tema y modo
  const colors = darkMode ? {
    ...COLORS,
    primary: currentTheme.primary,
    primaryBright: currentTheme.accent,
    darker: currentTheme.bg,
  } : COLORS_LIGHT

  // Obtener saludo según hora
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return { text: 'Buenos días', icon: '🌅' }
    if (hour >= 12 && hour < 19) return { text: 'Buenas tardes', icon: '☀️' }
    return { text: 'Buenas noches', icon: '🌙' }
  }, [])

  // Formatear tiempo
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}min`
    return `${mins} min`
  }

  // Cargar estadísticas
  useEffect(() => {
    const savedStats = localStorage.getItem('fm9_stats')
    if (savedStats) {
      const parsed = JSON.parse(savedStats)
      requestAnimationFrame(() => setStats(parsed))
    }
  }, [])

  // Guardar estadísticas
  useEffect(() => {
    localStorage.setItem('fm9_stats', JSON.stringify(stats))
  }, [stats])

  // Actualizar estadísticas mientras reproduce
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isPlaying) {
      interval = setInterval(() => {
        listenTimeRef.current += 1
        setCurrentVolumeLevel(analyserRef.current ? getVolumeLevel() : 0)
        
        // Cada 60 segundos, actualizar stats
        if (listenTimeRef.current >= 60) {
          listenTimeRef.current = 0
          const now = new Date()
          const today = now.toDateString()
          const hour = now.getHours()
          
          setStats(prev => {
            const newStats = { ...prev }
            newStats.totalMinutes += 1
            newStats.todayMinutes += 1
            
            // Verificar racha
            if (prev.lastListenDate !== today) {
              const yesterday = new Date(now)
              yesterday.setDate(yesterday.getDate() - 1)
              if (prev.lastListenDate === yesterday.toDateString()) {
                newStats.streak += 1
              } else if (prev.lastListenDate !== today) {
                newStats.streak = 1
              }
            }
            newStats.lastListenDate = today
            
            // Verificar horarios especiales
            if (hour >= 0 && hour < 5) newStats.nightListener = true
            if (hour >= 5 && hour < 7) newStats.morningListener = true
            
            // Verificar logros
            ACHIEVEMENTS.forEach(achievement => {
              if (!newStats.achievements.includes(achievement.id) && achievement.check(newStats)) {
                newStats.achievements.push(achievement.id)
              }
            })
            
            return newStats
          })
        }
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying])

  // Obtener nivel de volumen
  const getVolumeLevel = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return 0
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
    return average / 255
  }, [])

  // Obtener clima
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Usando Open-Meteo API (no requiere API key)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${TRES_ISLETAS_LAT}&longitude=${TRES_ISLETAS_LON}&current_weather=true&timezone=America/Argentina/Buenos_Aires`
        )
        const data = await response.json()
        
        if (data.current_weather) {
          const temp = Math.round(data.current_weather.temperature)
          const code = data.current_weather.weathercode
          
          // Mapear código de clima a descripción e icono
          let desc = 'Despejado'
          let icon = '☀️'
          
          if (code <= 3) { icon = '☀️'; desc = 'Despejado' }
          else if (code <= 49) { icon = '☁️'; desc = 'Nublado' }
          else if (code <= 69) { icon = '🌧️'; desc = 'Lluvia' }
          else if (code <= 79) { icon = '❄️'; desc = 'Nieve' }
          else if (code <= 99) { icon = '⛈️'; desc = 'Tormenta' }
          
          setWeather({ temp, desc, icon })
        }
      } catch (error) {
        console.error('Error fetching weather:', error)
      } finally {
        setWeatherLoading(false)
      }
    }
    
    fetchWeather()
    // Actualizar cada 30 minutos
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Referencias para reconexión
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wasPlayingRef = useRef<boolean>(false)
  const isReconnectingRef = useRef<boolean>(false)
  const firstTouchDoneRef = useRef<boolean>(false)
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Obtener programa actual
  const getCurrentProgram = useCallback(() => {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    
    const program = PROGRAMMING.find(p => 
      hour >= p.start && hour < p.end && p.days.includes(day)
    )
    return program?.name || 'FM 9 de Julio'
  }, [])

  // Actualizar programa actual
  useEffect(() => {
    const updateProgram = () => setCurrentProgram(getCurrentProgram())
    updateProgram()
    const interval = setInterval(updateProgram, 60000)
    return () => clearInterval(interval)
  }, [getCurrentProgram])

  // Detectar modo oscuro
  useEffect(() => {
    const savedMode = localStorage.getItem('fm9_darkMode')
    if (savedMode !== null) {
      requestAnimationFrame(() => setDarkMode(savedMode === 'true'))
    }
  }, [])

  // Detectar tema guardado
  useEffect(() => {
    const savedTheme = localStorage.getItem('fm9_theme')
    if (savedTheme) {
      const idx = parseInt(savedTheme)
      if (idx >= 0 && idx < THEMES.length) {
        setThemeIndex(idx)
        setCurrentTheme(THEMES[idx])
      }
    }
  }, [])

  // Detectar offline
  useEffect(() => {
    requestAnimationFrame(() => setIsOffline(!navigator.onLine))
    
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Instalación PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
      
      setTimeout(() => {
        const dismissed = localStorage.getItem('fm9_install_dismissed')
        if (!dismissed) {
          setShowInstallPrompt(true)
        }
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Instalar PWA
  const installPWA = async () => {
    if (!deferredPrompt) return
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(deferredPrompt as any).prompt()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { outcome } = await (deferredPrompt as any).userChoice
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false)
      setIsInstallable(false)
    }
    
    setDeferredPrompt(null)
  }

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('fm9_install_dismissed', 'true')
  }

  // Cambiar modo de visualizador
  const cycleVisualizerMode = useCallback(() => {
    const newMode = visualizerModeRef.current >= 12 ? 0 : visualizerModeRef.current + 1
    visualizerModeRef.current = newMode
    fullscreenModeRef.current = newMode
    setVisualizerMode(newMode)
  }, [])

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('fm9_darkMode', String(newMode))
  }, [darkMode])

  // Cambiar tema
  const cycleTheme = useCallback(() => {
    const newIdx = (themeIndex + 1) % THEMES.length
    setThemeIndex(newIdx)
    setCurrentTheme(THEMES[newIdx])
    localStorage.setItem('fm9_theme', String(newIdx))
  }, [themeIndex])

  // Toggle party mode
  const togglePartyMode = useCallback(() => {
    setPartyMode(prev => !prev)
  }, [])

  // Sleep timer
  const setSleep = useCallback((minutes: number) => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current)
    }
    
    setSleepTimer(minutes)
    setShowSleepOptions(false)
    
    if (minutes > 0) {
      const endTime = Date.now() + minutes * 60 * 1000
      
      const updateTimer = () => {
        const remaining = Math.max(0, endTime - Date.now())
        if (remaining <= 0) {
          pauseRef.current()
          setSleepTimer(null)
          setSleepTimerDisplay(null)
          return
        }
        
        const mins = Math.floor(remaining / 60000)
        const secs = Math.floor((remaining % 60000) / 1000)
        setSleepTimerDisplay(`${mins}:${secs.toString().padStart(2, '0')}`)
        
        sleepTimerRef.current = setTimeout(updateTimer, 1000)
      }
      
      updateTimer()
    } else {
      setSleepTimerDisplay(null)
    }
  }, [])

  // Media Session API
  const setupMediaSession = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentProgram || 'FM 9 de Julio 102.3 MHz',
        artist: 'Tres Isletas, Chaco, Argentina',
        album: 'Radio en vivo',
        artwork: [
          { src: 'https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=96&ssl=1', sizes: '96x96', type: 'image/png' },
          { src: 'https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=192&ssl=1', sizes: '192x192', type: 'image/png' },
          { src: 'https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=512&ssl=1', sizes: '512x512', type: 'image/png' },
        ]
      })

      navigator.mediaSession.setActionHandler('play', () => playRef.current())
      navigator.mediaSession.setActionHandler('pause', () => pauseRef.current())
      navigator.mediaSession.setActionHandler('stop', () => pauseRef.current())
    }
  }, [currentProgram])

  // Partículas
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, size: number, alpha: number, hue: number}>>([])

  // Fiesta colors
  const fiestaHueRef = useRef(0)

  // Visualizador
  const drawVisualizer = useCallback((canvas: HTMLCanvasElement, isFullscreen: boolean = false) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    const centerX = width / 2
    const centerY = height / 2
    const mode = isFullscreen ? fullscreenModeRef.current : visualizerModeRef.current
    const analyser = analyserRef.current
    
    ctx.clearRect(0, 0, width, height)

    // Modo desactivado
    if (mode === 0) {
      ctx.fillStyle = colors.textMuted
      ctx.font = isFullscreen ? '24px sans-serif' : '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Visualizador desactivado', centerX, centerY)
      return
    }
    
    if (!analyser) {
      const barCount = 40
      const barWidth = width / barCount
      
      for (let i = 0; i < barCount; i++) {
        const barHeight = 3
        const x = i * barWidth
        ctx.fillStyle = `${colors.primary}30`
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight)
      }
      return
    }

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    const gradient = ctx.createLinearGradient(0, height, 0, 0)
    gradient.addColorStop(0, colors.primary)
    gradient.addColorStop(0.5, colors.primaryBright)
    gradient.addColorStop(1, colors.accent)

    // MODO 1-11: Igual que antes...
    if (mode === 1) {
      const barWidth = width / bufferLength
      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.9
        if (barHeight > 1) {
          ctx.fillStyle = gradient
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
        }
        x += barWidth
      }
    }
    else if (mode === 2) {
      const radius = Math.min(width, height) * 0.35
      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2
        const barHeight = (dataArray[i] / 255) * radius * 0.8
        const x1 = centerX + Math.cos(angle) * radius * 0.5
        const y1 = centerY + Math.sin(angle) * radius * 0.5
        const x2 = centerX + Math.cos(angle) * (radius * 0.5 + barHeight)
        const y2 = centerY + Math.sin(angle) * (radius * 0.5 + barHeight)
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2)
      ctx.strokeStyle = colors.primary
      ctx.lineWidth = 2
      ctx.stroke()
    }
    else if (mode === 3) {
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      for (let i = 0; i < bufferLength; i++) {
        const x = (i / bufferLength) * width
        const y = centerY + ((dataArray[i] / 255) - 0.5) * height * 0.8
        ctx.lineTo(x, y)
      }
      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.stroke()
    }
    else if (mode === 4) {
      const spacing = width / 30
      for (let i = 0; i < 30; i++) {
        const dataIndex = Math.floor((i / 30) * bufferLength)
        const radius = Math.max(2, (dataArray[dataIndex] / 255) * 15)
        const x = spacing * i + spacing / 2
        const y = centerY + ((dataArray[dataIndex] / 255) - 0.5) * height * 0.7
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }
    else if (mode === 5) {
      const barCount = 40
      const barWidth = width / barCount
      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength)
        const barHeight = (dataArray[dataIndex] / 255) * height * 0.4
        const x = i * barWidth
        if (barHeight > 1) {
          ctx.fillStyle = gradient
          ctx.fillRect(x, centerY - barHeight, barWidth - 2, barHeight)
          ctx.fillRect(x, centerY, barWidth - 2, barHeight)
        }
      }
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(width, centerY)
      ctx.strokeStyle = colors.primary
      ctx.lineWidth = 1
      ctx.stroke()
    }
    else if (mode === 6 || mode === 7) {
      const analyserLeft = analyserLeftRef.current
      const analyserRight = analyserRightRef.current
      if (analyserLeft && analyserRight) {
        const bufferLen = analyserLeft.frequencyBinCount
        const leftData = new Uint8Array(bufferLen)
        const rightData = new Uint8Array(bufferLen)
        analyserLeft.getByteFrequencyData(leftData)
        analyserRight.getByteFrequencyData(rightData)
        
        if (mode === 6) {
          const halfWidth = width / 2
          const barWidth = halfWidth / bufferLen
          for (let i = 0; i < bufferLen; i++) {
            const barHeight = (leftData[i] / 255) * height * 0.85
            const x = halfWidth - ((i + 1) * barWidth)
            if (barHeight > 1) {
              ctx.fillStyle = '#00CED1'
              ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
            }
          }
          for (let i = 0; i < bufferLen; i++) {
            const barHeight = (rightData[i] / 255) * height * 0.85
            const x = halfWidth + (i * barWidth)
            if (barHeight > 1) {
              ctx.fillStyle = '#FFD700'
              ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
            }
          }
        } else {
          const barWidth = width / bufferLen
          const halfHeight = height / 2
          for (let i = 0; i < bufferLen; i++) {
            const barHeight = (leftData[i] / 255) * halfHeight * 0.9
            const x = i * barWidth
            if (barHeight > 1) {
              ctx.fillStyle = '#00CED1'
              ctx.fillRect(x, halfHeight - barHeight, barWidth - 1, barHeight)
            }
          }
          for (let i = 0; i < bufferLen; i++) {
            const barHeight = (rightData[i] / 255) * halfHeight * 0.9
            const x = i * barWidth
            if (barHeight > 1) {
              ctx.fillStyle = '#FFD700'
              ctx.fillRect(x, halfHeight, barWidth - 1, barHeight)
            }
          }
        }
      }
    }
    else if (mode === 8) {
      const avgFreq = dataArray.reduce((a, b) => a + b, 0) / bufferLength
      const intensity = avgFreq / 255
      if (intensity > 0.1) {
        const numParticles = Math.floor(intensity * 5)
        for (let i = 0; i < numParticles; i++) {
          particlesRef.current.push({
            x: centerX + (Math.random() - 0.5) * 100,
            y: centerY,
            vx: (Math.random() - 0.5) * 4 * intensity,
            vy: (Math.random() - 0.5) * 4 * intensity - 2,
            size: Math.random() * 4 + 2,
            alpha: 1,
            hue: 40
          })
        }
      }
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.02
        if (p.alpha > 0 && p.size > 0.5) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(218, 165, 32, ${p.alpha})`
          ctx.fill()
          return true
        }
        return false
      })
      if (particlesRef.current.length > 200) {
        particlesRef.current = particlesRef.current.slice(-200)
      }
    }
    else if (mode === 9) {
      const barWidth = width / bufferLength
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i] / 255
        const barHeight = height
        const x = i * barWidth
        const hue = (i / bufferLength) * 60 + 30
        const lightness = 20 + value * 60
        ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`
        ctx.fillRect(x, 0, barWidth - 1, barHeight)
      }
    }
    else if (mode === 10) {
      const time = Date.now() / 1000
      const avgFreq = dataArray.reduce((a, b) => a + b, 0) / bufferLength
      const intensity = avgFreq / 255
      const numRings = 15
      const maxRadius = Math.min(width, height) * 0.45
      for (let i = numRings; i >= 0; i--) {
        const progress = i / numRings
        const z = (progress + time * 0.5) % 1
        const radius = maxRadius * z
        const alpha = 1 - z
        const freqIndex = Math.floor(progress * bufferLength)
        const freqValue = dataArray[freqIndex] / 255
        const rotation = time + freqValue * 0.5
        ctx.beginPath()
        for (let j = 0; j <= 8; j++) {
          const angle = (j / 8) * Math.PI * 2 + rotation
          const wobble = 1 + freqValue * 0.3
          const x = centerX + Math.cos(angle) * radius * wobble
          const y = centerY + Math.sin(angle) * radius * wobble
          if (j === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = `hsla(40, 80%, ${50 + alpha * 30}%, ${alpha * intensity * 2})`
        ctx.lineWidth = 2 + freqValue * 3
        ctx.stroke()
      }
    }
    // MODO 11: Fiesta 🌈
    else if (mode === 11) {
      fiestaHueRef.current = (fiestaHueRef.current + 2) % 360
      const avgFreq = dataArray.reduce((a, b) => a + b, 0) / bufferLength
      const intensity = avgFreq / 255
      
      // Fondo con gradiente cambiante
      const bgGradient = ctx.createLinearGradient(0, 0, width, height)
      bgGradient.addColorStop(0, `hsla(${fiestaHueRef.current}, 70%, 10%, 0.3)`)
      bgGradient.addColorStop(0.5, `hsla(${(fiestaHueRef.current + 60) % 360}, 70%, 15%, 0.3)`)
      bgGradient.addColorStop(1, `hsla(${(fiestaHueRef.current + 120) % 360}, 70%, 10%, 0.3)`)
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)
      
      // Barras con colores arcoíris
      const barWidth = width / bufferLength
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.9
        const hue = (fiestaHueRef.current + (i / bufferLength) * 180) % 360
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.7 + intensity * 0.3})`
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
        
        // Efecto espejo
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`
        ctx.fillRect(i * barWidth, 0, barWidth - 1, barHeight * 0.3)
      }
      
      // Destellos
      if (intensity > 0.5) {
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * width
          const y = Math.random() * height
          const size = Math.random() * 10 * intensity
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 70%, ${Math.random()})`
          ctx.fill()
        }
      }
    }
    // MODO 12: Osciloscopio Vintage 📊
    else if (mode === 12) {
      // Fondo estilo CRT
      ctx.fillStyle = '#0a1a0a'
      ctx.fillRect(0, 0, width, height)
      
      // Líneas de rejilla
      ctx.strokeStyle = '#1a3a1a'
      ctx.lineWidth = 1
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, height)
        ctx.stroke()
      }
      for (let i = 0; i < height; i += 15) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(width, i)
        ctx.stroke()
      }
      
      // Línea central
      ctx.strokeStyle = '#2a4a2a'
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(width, centerY)
      ctx.stroke()
      
      // Onda del osciloscopio
      const timeData = new Uint8Array(analyser.fftSize)
      analyser.getByteTimeDomainData(timeData)
      
      ctx.beginPath()
      ctx.strokeStyle = '#00FF00'
      ctx.lineWidth = 2
      ctx.shadowColor = '#00FF00'
      ctx.shadowBlur = 10
      
      const sliceWidth = width / timeData.length
      let x = 0
      
      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0
        const y = v * centerY
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        x += sliceWidth
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      
      // Efecto de brillo CRT
      const crtGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.7)
      crtGradient.addColorStop(0, 'transparent')
      crtGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
      ctx.fillStyle = crtGradient
      ctx.fillRect(0, 0, width, height)
      
      // Texto vintage
      ctx.font = '10px monospace'
      ctx.fillStyle = '#00FF00'
      ctx.fillText('FM 9 de JULIO - 102.3 MHz', 5, 12)
      ctx.fillText(`AMP: ${Math.round(currentVolumeLevel * 100)}%`, 5, height - 5)
    }
  }, [colors, currentVolumeLevel])

  // Animación visualizador
  const startVisualizer = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      drawVisualizer(canvas, false)
    }
    animate()
  }, [drawVisualizer])

  // Animación fullscreen
  const startFullscreenVisualizer = useCallback(() => {
    const canvas = fullscreenCanvasRef.current
    if (!canvas) return
    const animate = () => {
      fullscreenAnimationRef.current = requestAnimationFrame(animate)
      drawVisualizer(canvas, true)
    }
    animate()
  }, [drawVisualizer])

  // Inicializar AudioContext
  const initAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioContextClass()
      audioContextRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.6
      analyserRef.current = analyser

      const analyserLeft = ctx.createAnalyser()
      analyserLeft.fftSize = 128
      analyserLeft.smoothingTimeConstant = 0.6
      analyserLeftRef.current = analyserLeft

      const analyserRight = ctx.createAnalyser()
      analyserRight.fftSize = 128
      analyserRight.smoothingTimeConstant = 0.6
      analyserRightRef.current = analyserRight

      const source = ctx.createMediaElementSource(audioRef.current)
      sourceRef.current = source

      const splitter = ctx.createChannelSplitter(2)
      const merger = ctx.createChannelMerger(2)

      source.connect(analyser)
      source.connect(splitter)
      splitter.connect(analyserLeft, 0)
      splitter.connect(analyserRight, 1)
      analyserLeft.connect(merger, 0, 0)
      analyserRight.connect(merger, 0, 1)
      merger.connect(ctx.destination)
    } catch (error) {
      console.error('Error AudioContext:', error)
    }
  }, [])

  // Play
  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    setIsLoading(true)
    setStatus('Conectando...')
    wasPlayingRef.current = true
    isReconnectingRef.current = false

    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      audio.src = STREAM_URL
      audio.load()
      await audio.play()
      if (!audioContextRef.current) {
        initAudioContext()
      }
      setupMediaSession()
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
      setIsPlaying(true)
      setIsLoading(false)
      setStatus('Reproduciendo en vivo')
    } catch (error: unknown) {
      setIsPlaying(false)
      setIsLoading(false)
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setStatus('Toca para reproducir')
      } else {
        setStatus('Error - Toca para reintentar')
      }
    }
  }, [initAudioContext, setupMediaSession])

  // Pause
  const pause = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      wasPlayingRef.current = false
      isReconnectingRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      audio.pause()
      setIsPlaying(false)
      setStatus('Pausado')
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused'
      }
    }
  }, [])

  useEffect(() => {
    playRef.current = play
    pauseRef.current = pause
  }, [play, pause])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }, [])

  const handleShare = useCallback(async () => {
    const shareData = {
      title: 'FM 9 de Julio 102.3 MHz',
      text: '¡Escucha FM 9 de Julio en vivo! La radio verdad, la radio solidaria.',
      url: window.location.href
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('¡URL copiada al portapapeles!')
      }
    } catch {
      // User cancelled
    }
  }, [])

  const sendDedicatoria = useCallback(() => {
    const message = encodeURIComponent('🎤 Quiero enviar un saludo por FM 9 de Julio 102.3 MHz!\n\n')
    window.open(`https://wa.me/543644503323?text=${message}`, '_blank')
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, play, pause])

  const toggleFullscreen = useCallback(() => {
    setShowFullscreen(prev => !prev)
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Eventos audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlaying = () => {
      if (!audioContextRef.current) initAudioContext()
      isReconnectingRef.current = false
      setIsPlaying(true)
      setIsLoading(false)
      setStatus('Reproduciendo en vivo')
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
    }

    const handleWaiting = () => {
      setIsLoading(true)
      setStatus('Cargando...')
    }

    const handleCanPlay = () => setIsLoading(false)

    const handleError = () => {
      if (isReconnectingRef.current) return
      if (!wasPlayingRef.current) {
        setIsPlaying(false)
        setIsLoading(false)
        setStatus('Error - Toca para reintentar')
        return
      }
      setIsPlaying(false)
      setStatus('Error - Reconectando...')
      setIsLoading(true)
      isReconnectingRef.current = true
      reconnectTimeoutRef.current = setTimeout(() => {
        if (wasPlayingRef.current && audio) {
          audio.src = STREAM_URL + '?t=' + Date.now()
          audio.load()
          audio.play().catch(() => {
            isReconnectingRef.current = false
            setStatus('Sin conexión - Toca para reintentar')
            setIsLoading(false)
          })
        }
      }, 3000)
    }

    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [initAudioContext])

  useEffect(() => {
    startVisualizer()
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [startVisualizer])

  useEffect(() => {
    if (showFullscreen) startFullscreenVisualizer()
    return () => {
      if (fullscreenAnimationRef.current) cancelAnimationFrame(fullscreenAnimationRef.current)
    }
  }, [showFullscreen, startFullscreenVisualizer])

  // Reconexión online
  useEffect(() => {
    const handleOnline = () => {
      const audio = audioRef.current
      if (wasPlayingRef.current && !isReconnectingRef.current && audio?.paused) {
        setStatus('Reconectando...')
        setIsLoading(true)
        isReconnectingRef.current = true
        audio.src = STREAM_URL + '?t=' + Date.now()
        audio.load()
        audio.play().catch(() => {
          isReconnectingRef.current = false
          setStatus('Error - Toca para reintentar')
          setIsLoading(false)
        })
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  // Autoplay
  useEffect(() => {
    const timer = setTimeout(() => {
      playRef.current().catch(() => {
        setStatus('Toca la pantalla para reproducir')
        setIsLoading(false)
      })
    }, 500)

    const handleFirstTouch = () => {
      if (firstTouchDoneRef.current) return
      firstTouchDoneRef.current = true
      if (!isPlaying && !isLoading) {
        setStatus('Conectando...')
        setIsLoading(true)
        playRef.current().catch(() => {
          setStatus('Error - Toca para reintentar')
          setIsLoading(false)
        })
      }
    }

    document.addEventListener('touchstart', handleFirstTouch, { once: true })
    document.addEventListener('click', handleFirstTouch, { once: true })

    return () => {
      clearTimeout(timer)
      document.removeEventListener('touchstart', handleFirstTouch)
      document.removeEventListener('click', handleFirstTouch)
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      else if (e.code === 'KeyF') toggleFullscreen()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, toggleFullscreen])

  const greeting = getGreeting()

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      width: '100%',
      background: darkMode 
        ? `linear-gradient(180deg, ${colors.darker} 0%, ${colors.dark} 50%, ${colors.darker} 100%)`
        : colors.darker,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 10px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      color: colors.text,
    }}>
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" playsInline style={{ display: 'none' }} />

      {/* Offline Banner */}
      {isOffline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#dc2626', color: 'white', padding: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', zIndex: 1000 }}>
          📡 Sin conexión a internet
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && isInstallable && (
        <div style={{ position: 'fixed', top: isOffline ? '28px' : '8px', left: '8px', right: '8px', background: colors.primary, color: colors.darker, padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>📲 Instalar App</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>Agregá FM 9 a tu pantalla de inicio</div>
          </div>
          <button onClick={installPWA} style={{ background: colors.darker, color: colors.primary, border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Instalar</button>
          <button onClick={dismissInstallPrompt} style={{ background: 'transparent', border: 'none', color: colors.darker, fontSize: '16px', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', paddingTop: showInstallPrompt ? '55px' : '0' }}>
        {/* Top bar */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          {/* Dark mode + Theme */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={toggleDarkMode} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={cycleTheme} style={{ background: currentTheme.primary, border: 'none', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
              🎨
            </button>
            <button onClick={togglePartyMode} style={{ background: partyMode ? '#FF69B4' : 'transparent', border: `1px solid ${colors.primary}`, borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>
              🌈
            </button>
          </div>
          
          {/* Clima */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '15px' }}>
            {weatherLoading ? (
              <span style={{ fontSize: '11px' }}>🌤️ --°</span>
            ) : weather ? (
              <>
                <span style={{ fontSize: '14px' }}>{weather.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: '500' }}>{weather.temp}°</span>
              </>
            ) : null}
          </div>
          
          {/* Sleep + Stats */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => setShowStats(!showStats)} style={{ background: 'transparent', border: `1px solid ${colors.primary}`, borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: colors.text }}>
              📊
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowSleepOptions(!showSleepOptions)} style={{ background: sleepTimer ? colors.primary : 'transparent', color: sleepTimer ? colors.darker : colors.textMuted, border: `1px solid ${colors.primary}`, borderRadius: '6px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}>
                ⏰ {sleepTimerDisplay || 'Timer'}
              </button>
              {showSleepOptions && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: colors.dark, border: `1px solid ${colors.primary}`, borderRadius: '6px', padding: '6px', zIndex: 100, minWidth: '100px' }}>
                  {[15, 30, 45, 60, 90].map(mins => (
                    <button key={mins} onClick={() => setSleep(mins)} style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', color: colors.text, padding: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '11px' }}>
                      {mins} min
                    </button>
                  ))}
                  <button onClick={() => setSleep(0)} style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', color: colors.primary, padding: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '11px' }}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saludo dinámico */}
        <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '5px' }}>
          {greeting.icon} {greeting.text}
        </div>

        {/* Logo */}
        <div style={{
          width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${colors.primary}`,
          boxShadow: isPlaying ? `0 0 25px ${colors.primary}80, 0 0 50px ${colors.primary}40` : `0 0 10px ${colors.primary}30`,
          background: colors.darker, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none', transition: 'box-shadow 0.5s ease',
        }}>
          <img src="https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=955&ssl=1" alt="FM 9 de Julio" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, margin: '8px 0 2px 0', textShadow: `0 2px 8px ${colors.primary}50`, textAlign: 'center' }}>FM 9 de Julio</h1>
        <p style={{ fontSize: '14px', color: colors.primary, margin: '0 0 2px 0', fontWeight: '600' }}>102.3 MHz</p>
        <p style={{ fontSize: '10px', color: colors.primary, margin: '2px 0', fontStyle: 'italic' }}>📻 {currentProgram}</p>
        <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>Tres Isletas, Chaco</p>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div style={{ width: '100%', maxWidth: '320px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px', marginBottom: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>{formatTime(stats.todayMinutes)}</div>
              <div style={{ fontSize: '9px', color: colors.textMuted }}>Hoy</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>{formatTime(stats.totalMinutes)}</div>
              <div style={{ fontSize: '9px', color: colors.textMuted }}>Total</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>🔥 {stats.streak}</div>
              <div style={{ fontSize: '9px', color: colors.textMuted }}>Racha</div>
            </div>
          </div>
          {stats.achievements.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
              {stats.achievements.map(id => {
                const achievement = ACHIEVEMENTS.find(a => a.id === id)
                return achievement ? (
                  <span key={id} style={{ fontSize: '16px' }} title={achievement.name}>{achievement.name.split(' ')[0]}</span>
                ) : null
              })}
            </div>
          )}
        </div>
      )}

      {/* VU Meter */}
      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
        <span style={{ fontSize: '10px', color: colors.textMuted }}>🎙️</span>
        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: `${currentVolumeLevel * 100}%`, height: '100%',
            background: currentVolumeLevel > 0.7 ? 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)' :
                       currentVolumeLevel > 0.4 ? 'linear-gradient(90deg, #22c55e, #eab308)' : '#22c55e',
            transition: 'width 0.1s ease', borderRadius: '4px'
          }} />
        </div>
        <span style={{ fontSize: '10px', color: colors.textMuted, minWidth: '30px' }}>{Math.round(currentVolumeLevel * 100)}%</span>
      </div>

      {/* Visualizador */}
      <div onClick={cycleVisualizerMode} style={{
        width: '100%', maxWidth: '320px', height: '50px', borderRadius: '8px', overflow: 'hidden',
        background: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)', border: `1px solid ${colors.primary}40`,
        cursor: 'pointer', position: 'relative', touchAction: 'manipulation',
      }}>
        <canvas ref={canvasRef} width={320} height={50} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: '2px', right: '5px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '6px', fontSize: '8px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span>{VISUALIZER_MODES[visualizerMode].icon}</span>
          <span>{VISUALIZER_MODES[visualizerMode].name}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); toggleFullscreen() }} style={{ position: 'absolute', top: '2px', right: '5px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', fontSize: '10px' }}>⛶</button>
      </div>

      {/* Estado y Play */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '12px', background: isPlaying ? 'rgba(218, 165, 32, 0.25)' : 'rgba(255,255,255,0.1)', border: `1px solid ${isPlaying ? colors.primary : 'rgba(255,255,255,0.2)'}`, marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPlaying ? '#4ade80' : colors.textMuted, animation: isPlaying ? 'blink 1s infinite' : 'none' }} />
          <span style={{ color: colors.text, fontSize: '11px', fontWeight: '500' }}>{status}</span>
        </div>

        <button onClick={togglePlay} disabled={isLoading} style={{
          width: '65px', height: '65px', borderRadius: '50%', border: 'none',
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
          cursor: isLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 25px ${colors.primary}50`, transition: 'transform 0.2s ease', touchAction: 'manipulation',
        }}>
          {isLoading ? (
            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : isPlaying ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
      </div>

      {/* Volumen */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 15px', background: darkMode ? 'rgba(218, 165, 32, 0.1)' : 'rgba(218, 165, 32, 0.15)', borderRadius: '20px', border: `1px solid ${colors.primary}30`, width: '100%', maxWidth: '260px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill={colors.primary}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} style={{ flex: 1, height: '5px', appearance: 'none', background: `linear-gradient(to right, ${colors.primary} ${volume * 100}%, ${colors.primary}30 ${volume * 100}%)`, borderRadius: '3px', cursor: 'pointer', outline: 'none' }} />
        <span style={{ color: colors.primary, fontSize: '11px', fontWeight: 'bold', minWidth: '30px' }}>{Math.round(volume * 100)}%</span>
      </div>

      {/* Botones */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', flex: '0 0 auto', flexWrap: 'wrap' }}>
        <button onClick={sendDedicatoria} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(236, 72, 153, 0.4)' }}><span style={{ fontSize: '16px' }}>💌</span></div>
          <span style={{ color: colors.textMuted, fontSize: '9px' }}>Dedicatoria</span>
        </button>
        <a href="https://wa.me/543644503323" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(37, 211, 102, 0.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <span style={{ color: colors.textMuted, fontSize: '9px' }}>WhatsApp</span>
        </a>
        <a href="https://www.facebook.com/fm9dejuliotresisletas" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(24, 119, 242, 0.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
          <span style={{ color: colors.textMuted, fontSize: '9px' }}>Facebook</span>
        </a>
        <button onClick={handleShare} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${colors.primary}40` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
          </div>
          <span style={{ color: colors.textMuted, fontSize: '9px' }}>Compartir</span>
        </button>
        <a href="https://play.google.com/store/apps/details?id=com.radioshd.fm9dejulio" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #00C4FF 0%, #7B2FFF 50%, #F50057 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(123, 47, 255, 0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
          </div>
          <span style={{ color: colors.textMuted, fontSize: '9px' }}>App</span>
        </a>
      </div>

      {/* Créditos */}
      <div style={{ textAlign: 'center', flex: '0 0 auto', paddingBottom: 'env(safe-area-inset-bottom, 5px)' }}>
        <p style={{ color: colors.primary, fontSize: '9px', fontStyle: 'italic', margin: '0 0 2px 0' }}>"La radio verdad... La radio solidaria..."</p>
        <span style={{ color: colors.textMuted, fontSize: '8px' }}>Diseñado por <a href="https://wa.me/543644536161" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none' }}>Davincho</a></span>
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: darkMode ? '#000' : colors.darker, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <canvas ref={fullscreenCanvasRef} width={typeof window !== 'undefined' ? window.innerWidth : 400} height={typeof window !== 'undefined' ? window.innerHeight : 800} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
          <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, textAlign: 'center', color: colors.text, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '22px', margin: 0, color: colors.primary }}>FM 9 de Julio</h2>
            <p style={{ fontSize: '12px', margin: '3px 0', color: colors.textMuted }}>102.3 MHz - {currentProgram}</p>
          </div>
          <button onClick={toggleFullscreen} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer', color: colors.text }}>✕</button>
          <div style={{ position: 'absolute', bottom: '25px', left: 0, right: 0, textAlign: 'center' }}>
            <button onClick={cycleVisualizerMode} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '15px', padding: '8px 15px', color: colors.text, fontSize: '12px', cursor: 'pointer' }}>
              {VISUALIZER_MODES[visualizerMode].icon} {VISUALIZER_MODES[visualizerMode].name}
            </button>
          </div>
        </div>
      )}

      {/* Animaciones */}
      <style jsx global>{`
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 25px ${colors.primary}50, 0 0 50px ${colors.primary}30; transform: scale(1); } 50% { box-shadow: 0 0 40px ${colors.primary}80, 0 0 70px ${colors.primary}50; transform: scale(1.02); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { margin: 0; padding: 0; overflow: hidden; position: fixed; width: 100%; height: 100%; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; overscroll-behavior: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #DAA520; cursor: pointer; box-shadow: 0 0 6px rgba(218, 165, 32, 0.6); border: 2px solid #FFD700; }
        input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #DAA520; cursor: pointer; box-shadow: 0 0 6px rgba(218, 165, 32, 0.6); border: 2px solid #FFD700; }
      `}</style>
    </div>
  )
}

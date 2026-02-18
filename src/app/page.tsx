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
  light: '#f5f5f5',
  lightDark: '#e0e0e0',
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
  light: '#1a1a1a',
  lightDark: '#333333',
}

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
]

// Programación de la radio (ejemplo - podés modificar los horarios)
const PROGRAMMING = [
  { name: 'Madrugada Musical', start: 0, end: 6, days: [0,1,2,3,4,5,6] },
  { name: 'Buenos Días Tres Isletas', start: 6, end: 9, days: [0,1,2,3,4,5,6] },
  { name: 'Mañana FM', start: 9, end: 12, days: [0,1,2,3,4,5,6] },
  { name: 'Mediodía con FM 9', start: 12, end: 15, days: [0,1,2,3,4,5,6] },
  { name: 'Tarde FM', start: 15, end: 18, days: [0,1,2,3,4,5,6] },
  { name: 'Atardecer Musical', start: 18, end: 21, days: [0,1,2,3,4,5,6] },
  { name: 'Noche FM 9 de Julio', start: 21, end: 24, days: [0,1,2,3,4,5,6] },
]

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
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('Toca para reproducir')
  const [volume, setVolume] = useState(1)
  const [visualizerMode, setVisualizerMode] = useState(1)
  const [darkMode, setDarkMode] = useState(true)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [currentProgram, setCurrentProgram] = useState('')
  const [sleepTimer, setSleepTimer] = useState<number | null>(null)
  const [sleepTimerDisplay, setSleepTimerDisplay] = useState<string | null>(null)
  const [showSleepOptions, setShowSleepOptions] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  
  // Referencias para reconexión automática simple
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wasPlayingRef = useRef<boolean>(false)
  const isReconnectingRef = useRef<boolean>(false)
  const firstTouchDoneRef = useRef<boolean>(false)
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Colores dinámicos según modo
  const colors = darkMode ? COLORS : COLORS_LIGHT

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

  // Actualizar programa actual cada minuto
  useEffect(() => {
    const updateProgram = () => setCurrentProgram(getCurrentProgram())
    updateProgram()
    const interval = setInterval(updateProgram, 60000)
    return () => clearInterval(interval)
  }, [getCurrentProgram])

  // Detectar modo oscuro del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const savedMode = localStorage.getItem('fm9_darkMode')
    if (savedMode !== null) {
      requestAnimationFrame(() => setDarkMode(savedMode === 'true'))
    } else {
      requestAnimationFrame(() => setDarkMode(mediaQuery.matches))
    }
  }, [])

  // Detectar si está offline
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
      
      // Mostrar prompt después de 5 segundos
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

  // Dismiss install prompt
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('fm9_install_dismissed', 'true')
  }

  // Cambiar modo de visualizador
  const cycleVisualizerMode = useCallback(() => {
    const newMode = visualizerModeRef.current >= 10 ? 0 : visualizerModeRef.current + 1
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

  // Sleep timer
  const setSleep = useCallback((minutes: number) => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current)
    }
    
    setSleepTimer(minutes)
    setShowSleepOptions(false)
    
    const updateDisplay = () => {
      const remaining = Math.ceil((sleepTimerRef.current ? 1 : 0))
      if (remaining <= 0) {
        setSleepTimerDisplay(null)
      }
    }
    
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

  // Media Session API para control en segundo plano
  const setupMediaSession = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentProgram || 'FM 9 de Julio 102.3 MHz',
        artist: 'Tres Isletas, Chaco, Argentina',
        album: 'Radio en vivo',
        artwork: [
          { src: 'https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=96&ssl=1', sizes: '96x96', type: 'image/png' },
          { src: 'https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=128&ssl=1', sizes: '128x128', type: 'image/png' },
          { src: 'https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=192&ssl=1', sizes: '192x192', type: 'image/png' },
          { src: 'https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=256&ssl=1', sizes: '256x256', type: 'image/png' },
          { src: 'https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=384&ssl=1', sizes: '384x384', type: 'image/png' },
          { src: 'https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=512&ssl=1', sizes: '512x512', type: 'image/png' },
        ]
      })

      navigator.mediaSession.setActionHandler('play', () => {
        playRef.current()
      })

      navigator.mediaSession.setActionHandler('pause', () => {
        pauseRef.current()
      })

      navigator.mediaSession.setActionHandler('stop', () => {
        pauseRef.current()
      })
    }
  }, [currentProgram])

  // Partículas para visualizador
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, size: number, alpha: number}>>([])

  // Visualizador de audio en tiempo real con múltiples modos
  const drawVisualizer = useCallback((canvas: HTMLCanvasElement, isFullscreen: boolean = false) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    const centerX = width / 2
    const centerY = height / 2
    const mode = isFullscreen ? fullscreenModeRef.current : visualizerModeRef.current
    const analyser = analyserRef.current
    
    // Limpiar canvas
    if (darkMode) {
      ctx.fillStyle = 'transparent'
    } else {
      ctx.fillStyle = colors.darker
    }
    ctx.clearRect(0, 0, width, height)

    // Modo desactivado
    if (mode === 0) {
      ctx.fillStyle = colors.textMuted
      ctx.font = isFullscreen ? '24px sans-serif' : '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Visualizador desactivado', centerX, centerY)
      return
    }
    
    // Si no hay analyser, mostrar barras pequeñas estáticas
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

    // Visualizador real en tiempo real
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    // Crear gradiente
    const gradient = ctx.createLinearGradient(0, height, 0, 0)
    gradient.addColorStop(0, colors.primary)
    gradient.addColorStop(0.5, colors.primaryBright)
    gradient.addColorStop(1, colors.accent)

    // MODO 1: Barras verticales
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
    
    // MODO 2: Circular
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
    
    // MODO 3: Onda
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
      
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      
      for (let i = 0; i < bufferLength; i++) {
        const x = (i / bufferLength) * width
        const y = centerY - ((dataArray[i] / 255) - 0.5) * height * 0.8
        ctx.lineTo(x, y)
      }
      
      ctx.strokeStyle = `${colors.primary}80`
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    // MODO 4: Puntos
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
    
    // MODO 5: Barras simétricas
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
    
    // MODO 6: Estéreo L/R
    else if (mode === 6) {
      const analyserLeft = analyserLeftRef.current
      const analyserRight = analyserRightRef.current
      
      if (analyserLeft && analyserRight) {
        const bufferLen = analyserLeft.frequencyBinCount
        const leftData = new Uint8Array(bufferLen)
        const rightData = new Uint8Array(bufferLen)
        analyserLeft.getByteFrequencyData(leftData)
        analyserRight.getByteFrequencyData(rightData)
        
        const halfWidth = width / 2
        const barWidth = halfWidth / bufferLen
        
        const gradientLeft = ctx.createLinearGradient(0, height, 0, 0)
        gradientLeft.addColorStop(0, '#00CED1')
        gradientLeft.addColorStop(0.5, '#00BFFF')
        gradientLeft.addColorStop(1, '#1E90FF')
        
        const gradientRight = ctx.createLinearGradient(0, height, 0, 0)
        gradientRight.addColorStop(0, '#FFD700')
        gradientRight.addColorStop(0.5, '#FFA500')
        gradientRight.addColorStop(1, '#FF8C00')
        
        for (let i = 0; i < bufferLen; i++) {
          const barHeight = (leftData[i] / 255) * height * 0.85
          const x = halfWidth - ((i + 1) * barWidth)
          if (barHeight > 1) {
            ctx.fillStyle = gradientLeft
            ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
          }
        }
        
        for (let i = 0; i < bufferLen; i++) {
          const barHeight = (rightData[i] / 255) * height * 0.85
          const x = halfWidth + (i * barWidth)
          if (barHeight > 1) {
            ctx.fillStyle = gradientRight
            ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
          }
        }
        
        ctx.beginPath()
        ctx.moveTo(halfWidth, 0)
        ctx.lineTo(halfWidth, height)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()
        
        ctx.font = '8px sans-serif'
        ctx.fillStyle = '#00CED1'
        ctx.textAlign = 'center'
        ctx.fillText('L', 10, height - 3)
        ctx.fillStyle = '#FFD700'
        ctx.fillText('R', width - 10, height - 3)
      }
    }
    
    // MODO 7: Estéreo Dual
    else if (mode === 7) {
      const analyserLeft = analyserLeftRef.current
      const analyserRight = analyserRightRef.current
      
      if (analyserLeft && analyserRight) {
        const bufferLen = analyserLeft.frequencyBinCount
        const leftData = new Uint8Array(bufferLen)
        const rightData = new Uint8Array(bufferLen)
        analyserLeft.getByteFrequencyData(leftData)
        analyserRight.getByteFrequencyData(rightData)
        
        const barWidth = width / bufferLen
        const halfHeight = height / 2
        
        const gradientLeft = ctx.createLinearGradient(0, halfHeight, 0, 0)
        gradientLeft.addColorStop(0, '#00CED1')
        gradientLeft.addColorStop(0.5, '#20B2AA')
        gradientLeft.addColorStop(1, '#3CB371')
        
        const gradientRight = ctx.createLinearGradient(0, height, 0, halfHeight)
        gradientRight.addColorStop(0, '#FFD700')
        gradientRight.addColorStop(0.5, '#FF6B6B')
        gradientRight.addColorStop(1, '#FF69B4')
        
        for (let i = 0; i < bufferLen; i++) {
          const barHeight = (leftData[i] / 255) * halfHeight * 0.9
          const x = i * barWidth
          if (barHeight > 1) {
            ctx.fillStyle = gradientLeft
            ctx.fillRect(x, halfHeight - barHeight, barWidth - 1, barHeight)
          }
        }
        
        for (let i = 0; i < bufferLen; i++) {
          const barHeight = (rightData[i] / 255) * halfHeight * 0.9
          const x = i * barWidth
          if (barHeight > 1) {
            ctx.fillStyle = gradientRight
            ctx.fillRect(x, halfHeight, barWidth - 1, barHeight)
          }
        }
        
        ctx.beginPath()
        ctx.moveTo(0, halfHeight)
        ctx.lineTo(width, halfHeight)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
    
    // MODO 8: Partículas
    else if (mode === 8) {
      const avgFreq = dataArray.reduce((a, b) => a + b, 0) / bufferLength
      const intensity = avgFreq / 255
      
      // Añadir nuevas partículas basadas en el audio
      if (intensity > 0.1) {
        const numParticles = Math.floor(intensity * 5)
        for (let i = 0; i < numParticles; i++) {
          particlesRef.current.push({
            x: centerX + (Math.random() - 0.5) * 100,
            y: centerY,
            vx: (Math.random() - 0.5) * 4 * intensity,
            vy: (Math.random() - 0.5) * 4 * intensity - 2,
            size: Math.random() * 4 + 2,
            alpha: 1
          })
        }
      }
      
      // Actualizar y dibujar partículas
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.02
        p.size *= 0.99
        
        if (p.alpha > 0 && p.size > 0.5) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(218, 165, 32, ${p.alpha})`
          ctx.fill()
          return true
        }
        return false
      })
      
      // Limitar partículas
      if (particlesRef.current.length > 200) {
        particlesRef.current = particlesRef.current.slice(-200)
      }
      
      // Centro brillante
      const centerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50 * (1 + intensity))
      centerGlow.addColorStop(0, `rgba(255, 215, 0, ${0.8 * intensity})`)
      centerGlow.addColorStop(0.5, `rgba(218, 165, 32, ${0.4 * intensity})`)
      centerGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = centerGlow
      ctx.fillRect(0, 0, width, height)
    }
    
    // MODO 9: Espectrograma
    else if (mode === 9) {
      const barWidth = width / bufferLength
      
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i] / 255
        const barHeight = height
        const x = i * barWidth
        
        // Crear espectro de colores
        const hue = (i / bufferLength) * 60 + 30 // Amarillo a naranja
        const lightness = 20 + value * 60
        
        ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`
        ctx.fillRect(x, 0, barWidth - 1, barHeight)
      }
      
      // Línea de frecuencia
      ctx.beginPath()
      ctx.moveTo(0, height)
      for (let i = 0; i < bufferLength; i++) {
        const x = (i / bufferLength) * width
        const y = height - (dataArray[i] / 255) * height
        ctx.lineTo(x, y)
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    // MODO 10: 3D Tunnel
    else if (mode === 10) {
      const time = Date.now() / 1000
      const avgFreq = dataArray.reduce((a, b) => a + b, 0) / bufferLength
      const intensity = avgFreq / 255
      
      // Dibujar túnel 3D
      const numRings = 15
      const maxRadius = Math.min(width, height) * 0.45
      
      for (let i = numRings; i >= 0; i--) {
        const progress = i / numRings
        const z = (progress + time * 0.5) % 1
        const radius = maxRadius * z
        const alpha = 1 - z
        
        const freqIndex = Math.floor(progress * bufferLength)
        const freqValue = dataArray[freqIndex] / 255
        
        // Rotar según audio
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
        
        const hue = 40 + freqValue * 20
        ctx.strokeStyle = `hsla(${hue}, 80%, ${50 + alpha * 30}%, ${alpha * intensity * 2})`
        ctx.lineWidth = 2 + freqValue * 3
        ctx.stroke()
      }
      
      // Centro pulsante
      const pulseRadius = 20 + intensity * 30
      const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius)
      centerGradient.addColorStop(0, `rgba(255, 215, 0, ${intensity})`)
      centerGradient.addColorStop(1, 'transparent')
      ctx.fillStyle = centerGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [colors, darkMode])

  // Animación del visualizador principal
  const startVisualizer = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      drawVisualizer(canvas, false)
    }

    animate()
  }, [drawVisualizer])

  // Animación del visualizador fullscreen
  const startFullscreenVisualizer = useCallback(() => {
    const canvas = fullscreenCanvasRef.current
    if (!canvas) return

    const animate = () => {
      fullscreenAnimationRef.current = requestAnimationFrame(animate)
      drawVisualizer(canvas, true)
    }

    animate()
  }, [drawVisualizer])

  // Inicializar AudioContext para visualizador
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
      
      console.log('AudioContext inicializado con soporte estéreo')
    } catch (error) {
      console.error('Error AudioContext:', error)
    }
  }, [])

  // Función para reproducir
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
      console.error('Error:', error)
      setIsPlaying(false)
      setIsLoading(false)

      if (error instanceof Error && error.name === 'NotAllowedError') {
        setStatus('Toca para reproducir')
      } else {
        setStatus('Error - Toca para reintentar')
      }
    }
  }, [initAudioContext, setupMediaSession])

  // Función para pausar
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

  // Actualizar refs
  useEffect(() => {
    playRef.current = play
    pauseRef.current = pause
  }, [play, pause])

  // Función para cambiar volumen
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }, [])

  // Función para compartir
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
    } catch (error) {
      console.log('Error al compartir:', error)
    }
  }, [])

  // Enviar dedicatoria por WhatsApp
  const sendDedicatoria = useCallback(() => {
    const message = encodeURIComponent('🎤 Quiero enviar un saludo por FM 9 de Julio 102.3 MHz!\n\n')
    window.open(`https://wa.me/543644503323?text=${message}`, '_blank')
  }, [])

  // Toggle
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  // Toggle fullscreen visualizer
  const toggleFullscreen = useCallback(() => {
    setShowFullscreen(prev => !prev)
  }, [])

  // Sincronizar volumen cuando el audio se inicializa
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Eventos del audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlaying = () => {
      if (!audioContextRef.current) {
        initAudioContext()
      }
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

    const handleCanPlay = () => {
      setIsLoading(false)
    }

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

    const handleEnded = () => {
      console.log('Evento ended inesperado en stream de radio')
    }

    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [initAudioContext])

  // Iniciar visualizador
  useEffect(() => {
    startVisualizer()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [startVisualizer])

  // Iniciar visualizador fullscreen
  useEffect(() => {
    if (showFullscreen) {
      startFullscreenVisualizer()
    }
    
    return () => {
      if (fullscreenAnimationRef.current) {
        cancelAnimationFrame(fullscreenAnimationRef.current)
      }
    }
  }, [showFullscreen, startFullscreenVisualizer])

  // Reconexión cuando vuelve la conexión a internet
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

    const handleOffline = () => {
      if (wasPlayingRef.current) {
        setStatus('Sin conexión...')
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Autoplay al cargar - Intentar reproducir, si falla esperar primer toque
  useEffect(() => {
    const attemptAutoplay = () => {
      playRef.current().catch(() => {
        setStatus('Toca la pantalla para reproducir')
        setIsLoading(false)
      })
    }

    const timer = setTimeout(attemptAutoplay, 500)

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
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current)
      }
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'KeyF') {
        toggleFullscreen()
      } else if (e.code === 'KeyM') {
        const audio = audioRef.current
        if (audio) {
          audio.muted = !audio.muted
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, toggleFullscreen])

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
      padding: '15px 12px',
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
      {/* Audio */}
      <audio 
        ref={audioRef} 
        preload="auto" 
        crossOrigin="anonymous"
        playsInline
        style={{ display: 'none' }} 
      />

      {/* Offline Banner */}
      {isOffline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#dc2626',
          color: 'white',
          padding: '8px',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 1000,
        }}>
          📡 Sin conexión a internet
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && isInstallable && (
        <div style={{
          position: 'fixed',
          top: isOffline ? '32px' : '10px',
          left: '10px',
          right: '10px',
          background: colors.primary,
          color: colors.darker,
          padding: '12px 15px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          zIndex: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>📲 Instalar App</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Agregá FM 9 a tu pantalla de inicio</div>
          </div>
          <button onClick={installPWA} style={{
            background: colors.darker,
            color: colors.primary,
            border: 'none',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
            Instalar
          </button>
          <button onClick={dismissInstallPrompt} style={{
            background: 'transparent',
            border: 'none',
            color: colors.darker,
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0 5px',
          }}>
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        flex: '0 0 auto',
        paddingTop: showInstallPrompt ? '60px' : '0',
      }}>
        {/* Top bar */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}>
          {/* Dark mode toggle */}
          <button onClick={toggleDarkMode} style={{
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '5px',
          }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {/* Sleep timer */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSleepOptions(!showSleepOptions)} style={{
              background: sleepTimer ? colors.primary : 'transparent',
              color: sleepTimer ? colors.darker : colors.textMuted,
              border: `1px solid ${colors.primary}`,
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              ⏰ {sleepTimerDisplay || 'Timer'}
            </button>
            
            {showSleepOptions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: colors.dark,
                border: `1px solid ${colors.primary}`,
                borderRadius: '8px',
                padding: '8px',
                zIndex: 100,
                minWidth: '120px',
              }}>
                {[15, 30, 45, 60, 90].map(mins => (
                  <button key={mins} onClick={() => setSleep(mins)} style={{
                    display: 'block',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: colors.text,
                    padding: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}>
                    {mins} minutos
                  </button>
                ))}
                <button onClick={() => setSleep(0)} style={{
                  display: 'block',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: colors.primary,
                  padding: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Logo con animación */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: `3px solid ${colors.primary}`,
          boxShadow: isPlaying 
            ? `0 0 30px rgba(218, 165, 32, 0.7), 0 0 60px rgba(218, 165, 32, 0.4)`
            : `0 0 15px rgba(218, 165, 32, 0.3)`,
          background: colors.darker,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none',
          transition: 'box-shadow 0.5s ease',
          transform: isPlaying ? 'scale(1)' : 'scale(0.95)',
        }}>
          <img
            src="https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=955&ssl=1"
            alt="FM 9 de Julio"
            style={{ width: '85%', height: '85%', objectFit: 'contain' }}
          />
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: colors.text,
          margin: '10px 0 3px 0',
          textShadow: `0 2px 10px rgba(218, 165, 32, 0.5)`,
          textAlign: 'center',
        }}>FM 9 de Julio</h1>
        
        <p style={{
          fontSize: '16px',
          color: colors.primary,
          margin: '0 0 2px 0',
          fontWeight: '600',
        }}>102.3 MHz</p>
        
        {/* Programa actual */}
        <p style={{
          fontSize: '11px',
          color: colors.primary,
          margin: '2px 0',
          fontStyle: 'italic',
        }}>📻 {currentProgram}</p>
        
        <p style={{
          fontSize: '12px',
          color: colors.textMuted,
          margin: 0,
        }}>Tres Isletas, Chaco</p>
      </div>

      {/* Visualizador */}
      <div 
        onClick={cycleVisualizerMode}
        style={{
          width: '100%',
          maxWidth: '350px',
          height: '55px',
          borderRadius: '10px',
          overflow: 'hidden',
          background: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
          border: `1px solid ${colors.primary}40`,
          flex: '0 0 auto',
          cursor: 'pointer',
          position: 'relative',
          touchAction: 'manipulation',
        }}>
        <canvas 
          ref={canvasRef} 
          width={350} 
          height={55}
          style={{ width: '100%', height: '100%', display: 'block' }} 
        />
        <div style={{
          position: 'absolute',
          bottom: '3px',
          right: '6px',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '2px 6px',
          borderRadius: '8px',
          fontSize: '9px',
          color: colors.textMuted,
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
        }}>
          <span>{VISUALIZER_MODES[visualizerMode].icon}</span>
          <span>{VISUALIZER_MODES[visualizerMode].name}</span>
        </div>
        
        {/* Fullscreen button */}
        <button onClick={(e) => { e.stopPropagation(); toggleFullscreen() }} style={{
          position: 'absolute',
          top: '3px',
          right: '6px',
          background: 'rgba(0, 0, 0, 0.6)',
          border: 'none',
          borderRadius: '5px',
          padding: '3px 6px',
          cursor: 'pointer',
          fontSize: '12px',
        }}>
          ⛶
        </button>
      </div>

      {/* Estado y Play */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        flex: '0 0 auto',
      }}>
        {/* Estado */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '15px',
          background: isPlaying 
            ? 'rgba(218, 165, 32, 0.25)' 
            : isLoading 
              ? 'rgba(218, 165, 32, 0.15)' 
              : 'rgba(255, 255, 255, 0.1)',
          border: `1px solid ${isPlaying || isLoading ? colors.primary : 'rgba(255,255,255,0.2)'}`,
          marginBottom: '15px',
        }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isPlaying ? '#4ade80' : isLoading ? colors.primary : colors.textMuted,
            animation: isPlaying || isLoading ? 'blink 1s infinite' : 'none',
          }} />
          <span style={{ color: colors.text, fontSize: '12px', fontWeight: '500' }}>
            {status}
          </span>
        </div>

        {/* Botón Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(218, 165, 32, 0.5)',
            transition: 'transform 0.2s ease',
            touchAction: 'manipulation',
          }}
        >
          {isLoading ? (
            <div style={{
              width: '30px',
              height: '30px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          ) : isPlaying ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Volumen */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '12px',
        padding: '10px 20px',
        background: darkMode ? 'rgba(218, 165, 32, 0.1)' : 'rgba(218, 165, 32, 0.15)',
        borderRadius: '25px',
        border: `1px solid ${colors.primary}30`,
        width: '100%',
        maxWidth: '280px',
        flex: '0 0 auto',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={colors.primary}>
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          style={{
            flex: 1,
            height: '6px',
            appearance: 'none',
            background: `linear-gradient(to right, ${colors.primary} ${volume * 100}%, ${colors.primary}30 ${volume * 100}%)`,
            borderRadius: '3px',
            cursor: 'pointer',
            outline: 'none',
          }}
        />
        
        <span style={{ 
          color: colors.primary, 
          fontSize: '12px', 
          fontWeight: 'bold',
          minWidth: '35px',
        }}>
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* Botones de acción */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px',
        flex: '0 0 auto',
        flexWrap: 'wrap',
      }}>
        {/* Dedicatoria */}
        <button onClick={sendDedicatoria} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '5px',
        }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%', background: '#EC4899',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(236, 72, 153, 0.4)',
          }}>
            <span style={{ fontSize: '18px' }}>💌</span>
          </div>
          <span style={{ color: colors.textMuted, fontSize: '10px' }}>Dedicatoria</span>
        </button>

        {/* WhatsApp */}
        <a href="https://wa.me/543644503323" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%', background: '#25D366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(37, 211, 102, 0.4)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <span style={{ color: colors.textMuted, fontSize: '10px' }}>WhatsApp</span>
        </a>

        {/* Facebook */}
        <a href="https://www.facebook.com/fm9dejuliotresisletas" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%', background: '#1877F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(24, 119, 242, 0.4)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <span style={{ color: colors.textMuted, fontSize: '10px' }}>Facebook</span>
        </a>

        {/* Compartir */}
        <button onClick={handleShare} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '5px',
        }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(218, 165, 32, 0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
          </div>
          <span style={{ color: colors.textMuted, fontSize: '10px' }}>Compartir</span>
        </button>

        {/* Play Store */}
        <a href="https://play.google.com/store/apps/details?id=com.radioshd.fm9dejulio" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00C4FF 0%, #7B2FFF 50%, #F50057 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(123, 47, 255, 0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
            </svg>
          </div>
          <span style={{ color: colors.textMuted, fontSize: '10px' }}>App</span>
        </a>
      </div>

      {/* Créditos */}
      <div style={{ textAlign: 'center', flex: '0 0 auto', paddingBottom: 'env(safe-area-inset-bottom, 5px)' }}>
        <p style={{
          color: colors.primary,
          fontSize: '10px',
          fontStyle: 'italic',
          margin: '0 0 3px 0',
        }}>
          &quot;La radio verdad... La radio solidaria...&quot;
        </p>
        <span style={{ color: colors.textMuted, fontSize: '9px' }}>
          Diseñado por{' '}
          <a href="https://wa.me/543644536161" target="_blank" rel="noopener noreferrer"
            style={{ color: colors.primary, textDecoration: 'none' }}>
            Davincho
          </a>
        </span>
      </div>

      {/* Fullscreen Visualizer Modal */}
      {showFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: darkMode ? '#000' : colors.darker,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <canvas 
            ref={fullscreenCanvasRef} 
            width={window.innerWidth}
            height={window.innerHeight}
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
          />
          
          {/* Info overlay */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: 0,
            right: 0,
            textAlign: 'center',
            color: colors.text,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}>
            <h2 style={{ fontSize: '24px', margin: 0, color: colors.primary }}>FM 9 de Julio</h2>
            <p style={{ fontSize: '14px', margin: '5px 0', color: colors.textMuted }}>102.3 MHz - {currentProgram}</p>
          </div>
          
          {/* Close button */}
          <button onClick={toggleFullscreen} style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            fontSize: '20px',
            cursor: 'pointer',
            color: colors.text,
          }}>
            ✕
          </button>
          
          {/* Mode indicator */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: 0,
            right: 0,
            textAlign: 'center',
          }}>
            <button onClick={cycleVisualizerMode} style={{
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              borderRadius: '20px',
              padding: '10px 20px',
              color: colors.text,
              fontSize: '14px',
              cursor: 'pointer',
            }}>
              {VISUALIZER_MODES[visualizerMode].icon} {VISUALIZER_MODES[visualizerMode].name}
            </button>
          </div>
        </div>
      )}

      {/* Animaciones */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(218, 165, 32, 0.5), 0 0 60px rgba(218, 165, 32, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 50px rgba(218, 165, 32, 0.8), 0 0 80px rgba(218, 165, 32, 0.5);
            transform: scale(1.02);
          }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { 
          margin: 0; 
          padding: 0; 
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          overscroll-behavior: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #DAA520;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(218, 165, 32, 0.6);
          border: 2px solid #FFD700;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #DAA520;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(218, 165, 32, 0.6);
          border: 2px solid #FFD700;
        }
      `}</style>
    </div>
  )
}

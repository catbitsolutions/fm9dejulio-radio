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
]

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const analyserLeftRef = useRef<AnalyserNode | null>(null)
  const analyserRightRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const playRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const pauseRef = useRef<() => void>(() => {})
  const visualizerModeRef = useRef<number>(1)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('Toca para reproducir')
  const [volume, setVolume] = useState(1)
  const [visualizerMode, setVisualizerMode] = useState(1)
  
  // Referencias para reconexión automática simple
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wasPlayingRef = useRef<boolean>(false)
  const isReconnectingRef = useRef<boolean>(false)

  // Cambiar modo de visualizador
  const cycleVisualizerMode = useCallback(() => {
    const newMode = visualizerModeRef.current >= 7 ? 0 : visualizerModeRef.current + 1
    visualizerModeRef.current = newMode
    setVisualizerMode(newMode)
  }, [])

  // Media Session API para control en segundo plano
  const setupMediaSession = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'FM 9 de Julio 102.3 MHz',
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
  }, [])

  // Visualizador de audio en tiempo real con múltiples modos
  const startVisualizer = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    const centerX = width / 2
    const centerY = height / 2

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, width, height)

      const mode = visualizerModeRef.current
      const analyser = analyserRef.current
      
      // Modo desactivado
      if (mode === 0) {
        ctx.fillStyle = COLORS.textMuted
        ctx.font = '12px sans-serif'
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
          ctx.fillStyle = `${COLORS.primary}30`
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
      gradient.addColorStop(0, COLORS.primary)
      gradient.addColorStop(0.5, COLORS.primaryBright)
      gradient.addColorStop(1, COLORS.accent)

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
        
        // Círculo central
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2)
        ctx.strokeStyle = COLORS.primary
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
        
        // Línea espejo
        ctx.beginPath()
        ctx.moveTo(0, centerY)
        
        for (let i = 0; i < bufferLength; i++) {
          const x = (i / bufferLength) * width
          const y = centerY - ((dataArray[i] / 255) - 0.5) * height * 0.8
          ctx.lineTo(x, y)
        }
        
        ctx.strokeStyle = `${COLORS.primary}80`
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
            // Barra hacia arriba
            ctx.fillRect(x, centerY - barHeight, barWidth - 2, barHeight)
            // Barra hacia abajo (espejo)
            ctx.fillRect(x, centerY, barWidth - 2, barHeight)
          }
        }
        
        // Línea central
        ctx.beginPath()
        ctx.moveTo(0, centerY)
        ctx.lineTo(width, centerY)
        ctx.strokeStyle = COLORS.primary
        ctx.lineWidth = 1
        ctx.stroke()
      }
      
      // MODO 6: Estéreo L/R (Canal izquierdo y derecho lado a lado)
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
          
          // Gradiente para canal izquierdo (azul/cian)
          const gradientLeft = ctx.createLinearGradient(0, height, 0, 0)
          gradientLeft.addColorStop(0, '#00CED1')
          gradientLeft.addColorStop(0.5, '#00BFFF')
          gradientLeft.addColorStop(1, '#1E90FF')
          
          // Gradiente para canal derecho (dorado/naranja)
          const gradientRight = ctx.createLinearGradient(0, height, 0, 0)
          gradientRight.addColorStop(0, '#FFD700')
          gradientRight.addColorStop(0.5, '#FFA500')
          gradientRight.addColorStop(1, '#FF8C00')
          
          // Barras canal izquierdo (mitad izquierda - crece hacia la derecha)
          for (let i = 0; i < bufferLen; i++) {
            const barHeight = (leftData[i] / 255) * height * 0.85
            const x = halfWidth - ((i + 1) * barWidth)
            if (barHeight > 1) {
              ctx.fillStyle = gradientLeft
              ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
            }
          }
          
          // Barras canal derecho (mitad derecha - crece hacia la derecha)
          for (let i = 0; i < bufferLen; i++) {
            const barHeight = (rightData[i] / 255) * height * 0.85
            const x = halfWidth + (i * barWidth)
            if (barHeight > 1) {
              ctx.fillStyle = gradientRight
              ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
            }
          }
          
          // Línea central divisoria
          ctx.beginPath()
          ctx.moveTo(halfWidth, 0)
          ctx.lineTo(halfWidth, height)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.lineWidth = 1
          ctx.stroke()
          
          // Etiquetas L/R
          ctx.font = '8px sans-serif'
          ctx.fillStyle = '#00CED1'
          ctx.textAlign = 'center'
          ctx.fillText('L', 10, height - 3)
          ctx.fillStyle = '#FFD700'
          ctx.fillText('R', width - 10, height - 3)
        } else {
          // Fallback si no hay analizadores estéreo
          ctx.fillStyle = COLORS.textMuted
          ctx.font = '10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('Estéreo no disponible', centerX, centerY)
        }
      }
      
      // MODO 7: Estéreo Dual (Arriba = Izquierdo, Abajo = Derecho)
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
          
          // Gradiente para canal izquierdo (verde/cian)
          const gradientLeft = ctx.createLinearGradient(0, halfHeight, 0, 0)
          gradientLeft.addColorStop(0, '#00CED1')
          gradientLeft.addColorStop(0.5, '#20B2AA')
          gradientLeft.addColorStop(1, '#3CB371')
          
          // Gradiente para canal derecho (dorado/rosa)
          const gradientRight = ctx.createLinearGradient(0, height, 0, halfHeight)
          gradientRight.addColorStop(0, '#FFD700')
          gradientRight.addColorStop(0.5, '#FF6B6B')
          gradientRight.addColorStop(1, '#FF69B4')
          
          // Barras canal izquierdo (mitad superior - crece hacia arriba)
          for (let i = 0; i < bufferLen; i++) {
            const barHeight = (leftData[i] / 255) * halfHeight * 0.9
            const x = i * barWidth
            if (barHeight > 1) {
              ctx.fillStyle = gradientLeft
              ctx.fillRect(x, halfHeight - barHeight, barWidth - 1, barHeight)
            }
          }
          
          // Barras canal derecho (mitad inferior - crece hacia abajo)
          for (let i = 0; i < bufferLen; i++) {
            const barHeight = (rightData[i] / 255) * halfHeight * 0.9
            const x = i * barWidth
            if (barHeight > 1) {
              ctx.fillStyle = gradientRight
              ctx.fillRect(x, halfHeight, barWidth - 1, barHeight)
            }
          }
          
          // Línea central horizontal
          ctx.beginPath()
          ctx.moveTo(0, halfHeight)
          ctx.lineTo(width, halfHeight)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.lineWidth = 1
          ctx.stroke()
          
          // Etiquetas L/R
          ctx.font = '8px sans-serif'
          ctx.textAlign = 'left'
          ctx.fillStyle = '#00CED1'
          ctx.fillText('L', 3, 10)
          ctx.fillStyle = '#FFD700'
          ctx.fillText('R', 3, height - 3)
        } else {
          // Fallback si no hay analizadores estéreo
          ctx.fillStyle = COLORS.textMuted
          ctx.font = '10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('Estéreo no disponible', centerX, centerY)
        }
      }
    }

    draw()
  }, [])

  // Inicializar AudioContext para visualizador
  const initAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioContextClass()
      audioContextRef.current = ctx

      // Analizador principal (mezcla estéreo)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.6
      analyserRef.current = analyser

      // Analizadores separados para canales estéreo
      const analyserLeft = ctx.createAnalyser()
      analyserLeft.fftSize = 128
      analyserLeft.smoothingTimeConstant = 0.6
      analyserLeftRef.current = analyserLeft

      const analyserRight = ctx.createAnalyser()
      analyserRight.fftSize = 128
      analyserRight.smoothingTimeConstant = 0.6
      analyserRightRef.current = analyserRight

      // Crear source desde el elemento audio
      const source = ctx.createMediaElementSource(audioRef.current)
      sourceRef.current = source

      // Crear splitter para separar canales estéreo
      const splitter = ctx.createChannelSplitter(2)
      
      // Crear merger para volver a unir los canales
      const merger = ctx.createChannelMerger(2)

      // Conexión para analizador principal (mezcla)
      source.connect(analyser)
      
      // Conexión para analizadores estéreo separados
      source.connect(splitter)
      
      // Conectar cada canal a su analizador
      splitter.connect(analyserLeft, 0)  // Canal izquierdo (output 0)
      splitter.connect(analyserRight, 1) // Canal derecho (output 1)
      
      // Reconectar canales al merger
      analyserLeft.connect(merger, 0, 0)  // Left -> merger input 0
      analyserRight.connect(merger, 0, 1) // Right -> merger input 1
      
      // Conectar merger al destino (altavoces)
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
    
    // Marcar que el usuario quiere reproducir
    wasPlayingRef.current = true
    isReconnectingRef.current = false

    try {
      // Resume AudioContext si está suspendido
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      // Cargar y reproducir
      audio.src = STREAM_URL
      audio.load()

      await audio.play()
      
      // Inicializar AudioContext DESPUÉS de que empiece a reproducir
      if (!audioContextRef.current) {
        initAudioContext()
      }
      
      // Configurar Media Session
      setupMediaSession()
      
      // Actualizar estado de Media Session
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
      // El usuario pausó manualmente - NO reconectar
      wasPlayingRef.current = false
      isReconnectingRef.current = false
      
      // Limpiar timer de reconexión
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      audio.pause()
      setIsPlaying(false)
      setStatus('Pausado')
      
      // Actualizar estado de Media Session
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

  // Toggle
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  // Sincronizar volumen cuando el audio se inicializa
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Eventos del audio - SIMPLIFICADO
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlaying = () => {
      if (!audioContextRef.current) {
        initAudioContext()
      }
      // Éxito - resetear flags
      isReconnectingRef.current = false
      setIsPlaying(true)
      setIsLoading(false)
      setStatus('Reproduciendo en vivo')
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
      console.log('Audio reproduciendo correctamente')
    }

    const handleWaiting = () => {
      setIsLoading(true)
      setStatus('Cargando...')
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handleError = (e: Event) => {
      console.log('Error de audio detectado')
      
      // Verificar si ya estamos reconectando
      if (isReconnectingRef.current) return
      
      // Verificar si el usuario pausó manualmente
      if (!wasPlayingRef.current) {
        setIsPlaying(false)
        setIsLoading(false)
        setStatus('Error - Toca para reintentar')
        return
      }
      
      // Intentar reconectar una sola vez
      setIsPlaying(false)
      setStatus('Error - Reconectando...')
      setIsLoading(true)
      isReconnectingRef.current = true
      
      // Esperar 3 segundos antes de reconectar
      reconnectTimeoutRef.current = setTimeout(() => {
        if (wasPlayingRef.current && audio) {
          console.log('Reconectando después de error...')
          audio.src = STREAM_URL + '?t=' + Date.now()
          audio.load()
          audio.play().catch(() => {
            console.log('Falló reconexión')
            isReconnectingRef.current = false
            setStatus('Sin conexión - Toca para reintentar')
            setIsLoading(false)
          })
        }
      }, 3000)
    }

    const handleEnded = () => {
      // Los streams de radio no deberían disparar 'ended'
      // Si pasa, probablemente es un error de red
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

  // Reconexión cuando vuelve la conexión a internet - SIMPLIFICADO
  useEffect(() => {
    const handleOnline = () => {
      console.log('Conexión a internet restaurada')
      
      // Solo reconectar si:
      // 1. El usuario tenía la radio reproduciendo
      // 2. No estamos ya reconectando
      // 3. El audio está pausado
      const audio = audioRef.current
      if (wasPlayingRef.current && !isReconnectingRef.current && audio?.paused) {
        console.log('Reconectando después de recuperar internet...')
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
      console.log('Sin conexión a internet')
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

  // Autoplay al cargar
  useEffect(() => {
    const timer = setTimeout(() => {
      playRef.current().catch(() => {
        setStatus('Toca para reproducir')
      })
    }, 500)

    return () => clearTimeout(timer)
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
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      width: '100%',
      background: `linear-gradient(180deg, ${COLORS.darker} 0%, ${COLORS.dark} 50%, ${COLORS.darker} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 15px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
    }}>
      {/* Audio con crossOrigin para CORS */}
      <audio 
        ref={audioRef} 
        preload="auto" 
        crossOrigin="anonymous"
        playsInline
        style={{ display: 'none' }} 
      />

      {/* Header con logo */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        flex: '0 0 auto',
      }}>
        {/* Logo */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: `4px solid ${COLORS.primary}`,
          boxShadow: isPlaying 
            ? `0 0 40px rgba(218, 165, 32, 0.7), 0 0 80px rgba(218, 165, 32, 0.4)`
            : `0 0 20px rgba(218, 165, 32, 0.3)`,
          background: COLORS.darker,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isPlaying ? 'pulse 2s infinite' : 'none',
          transition: 'box-shadow 0.5s ease',
        }}>
          <img
            src="https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=955&ssl=1"
            alt="FM 9 de Julio"
            style={{ width: '85%', height: '85%', objectFit: 'contain' }}
          />
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: '26px',
          fontWeight: 'bold',
          color: COLORS.text,
          margin: '15px 0 4px 0',
          textShadow: `0 2px 10px rgba(218, 165, 32, 0.5)`,
          textAlign: 'center',
        }}>FM 9 de Julio</h1>
        
        <p style={{
          fontSize: '18px',
          color: COLORS.primary,
          margin: '0 0 3px 0',
          fontWeight: '600',
        }}>102.3 MHz</p>
        
        <p style={{
          fontSize: '14px',
          color: COLORS.textMuted,
          margin: 0,
        }}>Tres Isletas, Chaco, Argentina</p>
      </div>

      {/* Visualizador en tiempo real - Clickeable */}
      <div 
        onClick={cycleVisualizerMode}
        style={{
          width: '100%',
          maxWidth: '350px',
          height: '60px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(218, 165, 32, 0.3)',
          flex: '0 0 auto',
          cursor: 'pointer',
          position: 'relative',
          touchAction: 'manipulation',
        }}>
        <canvas 
          ref={canvasRef} 
          width={350} 
          height={60}
          style={{ width: '100%', height: '100%', display: 'block' }} 
        />
        {/* Indicador de modo */}
        <div style={{
          position: 'absolute',
          bottom: '4px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '2px 8px',
          borderRadius: '10px',
          fontSize: '10px',
          color: COLORS.textMuted,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span>{VISUALIZER_MODES[visualizerMode].icon}</span>
          <span>{VISUALIZER_MODES[visualizerMode].name}</span>
        </div>
      </div>

      {/* Centro - Estado y Play */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        flex: '0 0 auto',
      }}>
        {/* Estado - Más pequeño */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: isPlaying 
            ? 'rgba(218, 165, 32, 0.25)' 
            : isLoading 
              ? 'rgba(218, 165, 32, 0.15)' 
              : 'rgba(255, 255, 255, 0.1)',
          border: `1px solid ${isPlaying || isLoading ? COLORS.primary : 'rgba(255,255,255,0.2)'}`,
          marginBottom: '20px',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isPlaying ? '#4ade80' : isLoading ? COLORS.primary : COLORS.textMuted,
            animation: isPlaying || isLoading ? 'blink 1s infinite' : 'none',
          }} />
          <span style={{ color: COLORS.text, fontSize: '13px', fontWeight: '500' }}>
            {status}
          </span>
        </div>

        {/* Botón Play/Pause - Más pequeño */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: 'none',
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 40px rgba(218, 165, 32, 0.5)',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
          }}
        >
          {isLoading ? (
            <div style={{
              width: '35px',
              height: '35px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          ) : isPlaying ? (
            <svg width="35" height="35" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="35" height="35" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* ESPACIO entre play y volumen */}
      <div style={{ height: '15px' }} />

      {/* Control de Volumen */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '15px',
        padding: '12px 25px',
        background: 'rgba(218, 165, 32, 0.1)',
        borderRadius: '30px',
        border: `1px solid rgba(218, 165, 32, 0.3)`,
        width: '100%',
        maxWidth: '320px',
        flex: '0 0 auto',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={COLORS.primary}>
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
            height: '8px',
            appearance: 'none',
            background: `linear-gradient(to right, ${COLORS.primary} ${volume * 100}%, rgba(218, 165, 32, 0.3) ${volume * 100}%)`,
            borderRadius: '4px',
            cursor: 'pointer',
            outline: 'none',
          }}
        />
        
        <svg width="24" height="24" viewBox="0 0 24 24" fill={COLORS.primary}>
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
        
        <span style={{ 
          color: COLORS.primary, 
          fontSize: '14px', 
          fontWeight: 'bold',
          minWidth: '40px',
          textAlign: 'right',
        }}>
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* Redes Sociales y Compartir */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '12px',
        flex: '0 0 auto',
      }}>
        {/* WhatsApp */}
        <a href="https://wa.me/543644503323" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', background: '#25D366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <span style={{ color: COLORS.textMuted, fontSize: '11px' }}>WhatsApp</span>
        </a>

        {/* Facebook */}
        <a href="https://www.facebook.com/fm9dejuliotresisletas" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', background: '#1877F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(24, 119, 242, 0.4)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <span style={{ color: COLORS.textMuted, fontSize: '11px' }}>Facebook</span>
        </a>

        {/* Compartir */}
        <button
          onClick={handleShare}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(218, 165, 32, 0.4)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
          </div>
          <span style={{ color: COLORS.textMuted, fontSize: '11px' }}>Compartir</span>
        </button>

        {/* Play Store */}
        <a href="https://play.google.com/store/apps/details?id=com.radioshd.fm9dejulio" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00C4FF 0%, #7B2FFF 50%, #F50057 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(123, 47, 255, 0.4)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
            </svg>
          </div>
          <span style={{ color: COLORS.textMuted, fontSize: '11px' }}>App</span>
        </a>
      </div>

      {/* Créditos */}
      <div style={{ 
        textAlign: 'center',
        flex: '0 0 auto',
        paddingBottom: 'env(safe-area-inset-bottom, 10px)',
      }}>
        <p style={{
          color: COLORS.primary,
          fontSize: '11px',
          fontStyle: 'italic',
          margin: '0 0 4px 0',
        }}>
          &quot;La radio verdad... La radio solidaria...&quot;
        </p>
        <span style={{ color: COLORS.textMuted, fontSize: '10px' }}>
          Diseñado por{' '}
          <a href="https://wa.me/543644536161" target="_blank" rel="noopener noreferrer"
            style={{ color: COLORS.primary, fontFamily: '"Audiowide", sans-serif', textDecoration: 'none' }}>
            Davincho
          </a>
        </span>
      </div>

      {/* Animaciones */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(218, 165, 32, 0.5), 0 0 80px rgba(218, 165, 32, 0.3); }
          50% { box-shadow: 0 0 60px rgba(218, 165, 32, 0.8), 0 0 100px rgba(218, 165, 32, 0.5); }
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
        
        /* Estilos del slider de volumen */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #DAA520;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(218, 165, 32, 0.6);
          border: 2px solid #FFD700;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #DAA520;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(218, 165, 32, 0.6);
          border: 2px solid #FFD700;
        }
      `}</style>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ==================== CONSTANTES ====================
const STREAM_URL = 'https://streaming01.radiosenlinea.com.ar/9622/stream'
const RADIO_URL = 'https://app.fm9dejulio.com.ar'
const SHARE_TEXT = '¡Escucha FM 9 de Julio 102.3 MHz en vivo! La radio verdad, la radio solidaria.'

// Tres Isletas, Chaco, Argentina
const WEATHER_LAT = -26.3456
const WEATHER_LON = -60.4347

// Colores base
const COLORS = {
  dark: { primary: '#DAA520', bright: '#FFD700', accent: '#C9A227', bg: '#0d0d0d', text: '#ffffff', muted: '#b0b0b0' },
  light: { primary: '#B8860B', bright: '#DAA520', accent: '#9B7B1F', bg: '#f5f0e6', text: '#1a1a1a', muted: '#5a5a5a' },
}

const THEMES = [
  { name: 'Dorado', primary: '#DAA520', accent: '#FFD700', bg: '#0d0d0d' },
  { name: 'Azul', primary: '#1E90FF', accent: '#00BFFF', bg: '#0a1628' },
  { name: 'Rosa', primary: '#FF69B4', accent: '#FF1493', bg: '#1a0a12' },
  { name: 'Verde', primary: '#32CD32', accent: '#00FF7F', bg: '#0a1a0a' },
  { name: 'Púrpura', primary: '#9370DB', accent: '#8A2BE2', bg: '#140a1a' },
]

// 10 modos oficiales del Luna Player (https://radioplayer.luna-universe.com/)
// Modo 0 = desactivado, modos 1-10 = visuales Luna
const VISUALIZER_MODES = [
  { name: 'Desactivado' },
  { name: 'Línea de espectro' },
  { name: 'Área de espectro' },
  { name: 'Barras finas' },
  { name: 'Curvas rellenas' },
  { name: 'Curvas trazadas' },
  { name: 'Barras en espejo' },
  { name: 'Partículas orbitales' },
  { name: 'Espectro 3D' },
  { name: 'Medidor VU estéreo' },
  { name: 'Barras gruesas' },
]

const ACHIEVEMENTS = [
  { id: 'first', name: 'Primera vez', check: (m: number) => m >= 1 },
  { id: 'hour', name: 'Una hora', check: (m: number) => m >= 60 },
  { id: 'fan', name: 'Fanático', check: (m: number) => m >= 300 },
  { id: 'streak3', name: 'Constancia', check: (_: number, s: number) => s >= 3 },
  { id: 'streak7', name: 'Semanal', check: (_: number, s: number) => s >= 7 },
]

// ==================== ICONOS SVG ====================
// Set de iconos SVG oficiales. Nada de emojis.
const svgProps = (size = 18, color = 'currentColor') => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: color,
  xmlns: 'http://www.w3.org/2000/svg',
})

const UIIcons = {
  // Clima
  sun: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
  ),
  moon: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
  ),
  sunCloud: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M12 2v2M5.6 5.6L7 7M2 12h2M19 12h2M17 7l1.4-1.4" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/><circle cx="9" cy="11" r="3" fill={c}/><path d="M19 21H7a4 4 0 010-8 5 5 0 019.6-1.5A4 4 0 1119 21z" fill={c} opacity="0.85"/></svg>
  ),
  cloud: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M19 17H7a4 4 0 010-8 5 5 0 019.6-1.5A4 4 0 1119 17z"/></svg>
  ),
  fog: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M3 9h18M3 13h18M3 17h12M5 21h14" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
  ),
  rain: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M16 13a4 4 0 00-4-7 5 5 0 00-9 3 4 4 0 003 7h9z" opacity="0.9"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
  ),
  snow: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M16 13a4 4 0 00-4-7 5 5 0 00-9 3 4 4 0 003 7h9z" opacity="0.9"/><circle cx="8" cy="19" r="0.8"/><circle cx="12" cy="20.5" r="0.8"/><circle cx="16" cy="19" r="0.8"/></svg>
  ),
  storm: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M16 13a4 4 0 00-4-7 5 5 0 00-9 3 4 4 0 003 7h9z" opacity="0.9"/><path d="M11 14l-2 4h3l-2 4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
  ),
  // UI
  palette: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.66 0 3-1.34 3-3 0-.78-.29-1.48-.78-2.01-.47-.51-.78-1.21-.78-1.99 0-1.66 1.34-3 3-3h1.06C20.96 13 24 9.96 24 6c0-2.21-3.58-4-12-4z" opacity="0.95"/><circle cx="6.5" cy="11.5" r="1.5" fill="#fff"/><circle cx="9.5" cy="7.5" r="1.5" fill="#fff"/><circle cx="14.5" cy="7.5" r="1.5" fill="#fff"/><circle cx="17.5" cy="11.5" r="1.5" fill="#fff"/></svg>
  ),
  stats: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="6" width="4" height="15" rx="1"/><rect x="17" y="9" width="4" height="12" rx="1"/></svg>
  ),
  clock: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="2"/><path d="M12 6v6l4 2" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
  ),
  download: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
  ),
  smartphone: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14z"/></svg>
  ),
  wifiOff: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M24 8.98l-2.12 2.13C19.5 8.43 16.92 7 14 7c-.7 0-1.39.09-2.06.27l-1.61-1.61C11.84 5.24 12.91 5 14 5c3.92 0 7.45 1.7 10 4zm-7.94 2.13L19 13.45c.39-.39.39-1.02 0-1.41l-.71-.71c-.39-.39-1.02-.39-1.41 0l-1.06 1.06-1.76-1.28zM3.42 2.36L2.01 3.78l2.13 2.13C2.16 8.45 1 11.66 1 15h2c0-3.03 1.06-5.79 2.81-7.94l2.14 2.14C6.94 10.78 6 13 6 15.32V16h2.94l-3.6 3.6 1.41 1.42L9.74 16h.34v.26L12.74 19l1.42-1.41L3.42 2.36z"/></svg>
  ),
  flame: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>
  ),
  music: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
  ),
  headphones: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M12 3a9 9 0 00-9 9v7c0 1.1.9 2 2 2h3v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-3v8h3c1.1 0 2-.9 2-2v-7a9 9 0 00-9-9z"/></svg>
  ),
  trophy: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
  ),
  close: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
  ),
  expand: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
  ),
  share: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke={c} strokeWidth="2" fill="none"/></svg>
  ),
  volume: (s = 18, c = 'currentColor') => (
    <svg {...svgProps(s, c)}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
  ),
  play: (s = 28, c = 'white') => (
    <svg {...svgProps(s, c)}><path d="M8 5v14l11-7z"/></svg>
  ),
  pause: (s = 28, c = 'white') => (
    <svg {...svgProps(s, c)}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
  ),
  whatsapp: (s = 18, c = 'white') => (
    <svg {...svgProps(s, c)}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  ),
  facebook: (s = 18, c = 'white') => (
    <svg {...svgProps(s, c)}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  ),
  app: (s = 18, c = 'white') => (
    <svg {...svgProps(s, c)}><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
  ),
  copy: (s = 18, c = 'white') => (
    <svg {...svgProps(s, c)}><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
  ),
  email: (s = 18, c = 'white') => (
    <svg {...svgProps(s, c)}><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
  ),
  twitter: (s = 18, c = 'white') => (
    <svg {...svgProps(s, c)}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  ),
  telegram: (s = 18, c = 'white') => (
    <svg {...svgProps(s, c)}><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
  ),
  instagram: (s = 18, c = 'white') => (
    <svg {...svgProps(s, c)}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  ),
}

// Map weather code + is_day -> icon
function weatherIcon(code: number, isDay: number): keyof typeof UIIcons {
  if (code === 0) return isDay ? 'sun' : 'moon'      // Clear sky
  if (code === 1) return isDay ? 'sun' : 'moon'      // Mainly clear
  if (code === 2 || code === 3) return 'sunCloud'    // Partly cloudy / Overcast
  if (code >= 45 && code <= 48) return 'fog'         // Fog
  if (code >= 51 && code <= 67) return 'rain'        // Drizzle / Rain
  if (code >= 71 && code <= 77) return 'snow'        // Snow
  if (code >= 80 && code <= 82) return 'rain'        // Rain showers
  if (code >= 85 && code <= 86) return 'snow'        // Snow showers
  if (code >= 95 && code <= 99) return 'storm'       // Thunderstorm
  return 'cloud'
}

const SHARE_OPTIONS = [
  { name: 'WhatsApp', icon: UIIcons.whatsapp, color: '#25D366', url: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}` },
  { name: 'Facebook', icon: UIIcons.facebook, color: '#1877F2', url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { name: 'Instagram', icon: UIIcons.instagram, color: '#E4405F', url: (_u: string, t: string) => `https://www.instagram.com/create/story/?caption=${encodeURIComponent(t)}` },
  { name: 'X', icon: UIIcons.twitter, color: '#000000', url: (u: string, t: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { name: 'Telegram', icon: UIIcons.telegram, color: '#0088cc', url: (u: string, t: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { name: 'Email', icon: UIIcons.email, color: '#EA4335', url: (u: string, t: string) => `mailto:?subject=${encodeURIComponent('FM 9 de Julio')}&body=${encodeURIComponent(t + '\n' + u)}` },
  { name: 'Copiar', icon: UIIcons.copy, color: '#6B7280', action: 'copy' },
]

interface Stats {
  totalMinutes: number
  streak: number
  lastDate: string
  todayMinutes: number
  achievements: string[]
}

export default function Home() {
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const analyserLRef = useRef<AnalyserNode | null>(null)
  const analyserRRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasFsRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const animFsRef = useRef<number>(0)
  // Modo inicial: 9 = Medidor VU estéreo (predeterminado del Luna Player)
  const modeRef = useRef(9)
  const modeFsRef = useRef(9)
  const listenRef = useRef(0)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasPlayingRef = useRef(false)
  const isReconnectingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const particlesRef = useRef<Array<{ x: number, y: number, vx: number, vy: number, size: number, alpha: number, hue: number }>>([])
  const playRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const pauseRef = useRef<() => void>(() => {})
  const logoScaleRef = useRef(1)  // Para animar el logo al ritmo del audio
  const logoImgRef = useRef<HTMLImageElement | null>(null)

  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('Toca para reproducir')
  const [volume, setVolume] = useState(1)
  const [mode, setMode] = useState(9)
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
  const [weather, setWeather] = useState<{ t: number, icon: keyof typeof UIIcons } | null>(null)
  const [stats, setStats] = useState<Stats>({ totalMinutes: 0, streak: 0, lastDate: '', todayMinutes: 0, achievements: [] })
  const [mounted, setMounted] = useState(false)

  const theme = THEMES[themeIdx]
  // En modo claro usamos una paleta adaptada; en oscuro preservamos los temas de color.
  const colors = dark
    ? { ...COLORS.dark, primary: theme.primary, bright: theme.accent, bg: theme.bg }
    : { ...COLORS.light, primary: theme.primary, bright: theme.accent }

  // Variables adaptativas según modo claro/oscuro
  // En modo claro usamos scrim claro + texto oscuro; en oscuro scrim oscuro + texto blanco
  const ui = dark
    ? {
        scrim1: 'rgba(13,13,13,0.78)',
        scrim2: 'rgba(13,13,13,0.85)',
        text: '#ffffff',
        textSoft: '#dddddd',
        pillBg: 'rgba(255,255,255,0.12)',
        pillBgActive: 'rgba(218, 165, 32, 0.25)',
        pillBorder: 'rgba(255,255,255,0.2)',
        panelBg: 'rgba(0,0,0,0.45)',
        modalBg: 'rgba(0,0,0,0.75)',
        sheetBg: '#0d0d0d',
        dropdownBg: 'rgba(13,13,13,0.95)',
        btnOverlayBg: 'rgba(0,0,0,0.6)',
        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        h1Shadow: `0 2px 12px ${colors.primary}80, 0 0 4px rgba(0,0,0,0.8)`,
      }
    : {
        scrim1: 'rgba(245,240,230,0.88)',
        scrim2: 'rgba(245,240,230,0.94)',
        text: '#1a1a1a',
        textSoft: '#444444',
        pillBg: 'rgba(255,255,255,0.75)',
        pillBgActive: 'rgba(218, 165, 32, 0.30)',
        pillBorder: 'rgba(0,0,0,0.12)',
        panelBg: 'rgba(255,255,255,0.85)',
        modalBg: 'rgba(0,0,0,0.55)',
        sheetBg: '#f5f0e6',
        dropdownBg: 'rgba(255,250,240,0.97)',
        btnOverlayBg: 'rgba(255,255,255,0.85)',
        textShadow: '0 1px 4px rgba(255,255,255,0.7)',
        h1Shadow: `0 2px 12px ${colors.primary}99, 0 0 4px rgba(255,255,255,0.8)`,
      }

  // Init
  useEffect(() => {
    const saved = localStorage.getItem('fm9_stats')
    const savedDark = localStorage.getItem('fm9_dark')
    const savedTheme = localStorage.getItem('fm9_theme')
    requestAnimationFrame(() => {
      setMounted(true)
      if (saved) { try { setStats(JSON.parse(saved)) } catch { /* ok */ } }
      if (savedDark) setDark(savedDark === 'true')
      if (savedTheme) setThemeIdx(parseInt(savedTheme) || 0)
      setOffline(!navigator.onLine)
    })
  }, [])

  useEffect(() => { localStorage.setItem('fm9_stats', JSON.stringify(stats)) }, [stats])

  // Weather (Tres Isletas, Chaco)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&current_weather=true&timezone=America/Argentina/Buenos_Aires`
        )
        const data = await res.json()
        if (data.current_weather) {
          const cw = data.current_weather
          const icon = weatherIcon(cw.weathercode, cw.is_day)
          setWeather({ t: Math.round(cw.temperature), icon })
        }
      } catch { /* ok */ }
    }
    fetchWeather()
    const iv = setInterval(fetchWeather, 1800000)
    return () => clearInterval(iv)
  }, [])

  // Stats
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

  // Online/Offline
  useEffect(() => {
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  // PWA Install
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e)
      setInstallable(true)
      setTimeout(() => { if (!localStorage.getItem('fm9_install_dismissed')) setInstallPrompt(true) }, 5000)
    }
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
  // IMPORTANTE: Conectamos source → analyser → destination para que el audio SIEMPRE
  // se escuche por los parlantes, incluso si Web Audio API tiene problemas.
  // El streaming devuelve Access-Control-Allow-Origin: *, así que crossOrigin="anonymous" funciona.
  const initAudio = useCallback(() => {
    if (!audioRef.current) return
    // Si ya existe un context y está activo, no hacer nada
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') return
    // Si existe pero está cerrado, limpiar las refs
    if (audioCtxRef.current && audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = null
      analyserRef.current = null
      analyserLRef.current = null
      analyserRRef.current = null
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      audioCtxRef.current = ctx

      // Crear source — si el elemento ya tiene un source previo (re-mount),
      // esto lanza. En ese caso, recargamos el audio para resetearlo.
      let source: MediaElementAudioSourceNode
      try {
        source = ctx.createMediaElementSource(audioRef.current)
      } catch {
        // El audio element ya tenía un source de un AudioContext anterior (cerrado).
        // Recargar el elemento para poder crear uno nuevo.
        audioRef.current.src = ''
        audioRef.current.load()
        source = ctx.createMediaElementSource(audioRef.current)
      }

      // Analyser principal (mono mix)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      analyserRef.current = analyser

      // Analysers estéreo L/R
      const analyserL = ctx.createAnalyser()
      analyserL.fftSize = 256
      analyserL.smoothingTimeConstant = 0.75
      analyserLRef.current = analyserL
      const analyserR = ctx.createAnalyser()
      analyserR.fftSize = 256
      analyserR.smoothingTimeConstant = 0.75
      analyserRRef.current = analyserR

      const splitter = ctx.createChannelSplitter(2)

      // Cadena de audio:
      //   source → analyser → destination   (audio SIEMPRE se escucha)
      //   source → splitter → analyserL/R   (solo análisis, sin salida)
      source.connect(analyser)
      source.connect(splitter)
      splitter.connect(analyserL, 0)
      splitter.connect(analyserR, 1)
      analyser.connect(ctx.destination)

      // IMPORTANTE: resumir el contexto inmediatamente.
      // Los AudioContext recién creados pueden iniciar en estado "suspended".
      // Si no se resumen, el audio pasa por el grafo pero no suena.
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => { /* ok */ })
      }
    } catch {
      // Si falla Web Audio, el <audio> element por su cuenta reproduce igual (no depende del grafo).
      audioCtxRef.current = null
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
      // IMPORTANTE: inicializar AudioContext ANTES de audio.play().
      // Esto asegura que el contexto se crea dentro del gesture del usuario
      // (click), lo que permite que inicie en estado "running" en vez de "suspended".
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') initAudio()
      // Resume sin await — si el contexto está suspended, el resume se resuelve
      // en background. Si hacemos await, puede colgarse si el browser no permite
      // resume sin gesture (autoplay path).
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => { /* ok */ })
      }
      audio.src = STREAM_URL
      audio.load()
      await audio.play()
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'FM 9 de Julio 102.3 MHz',
          artist: 'Tres Isletas, Chaco',
          album: 'Radio en vivo',
        })
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

  // Pause
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

  // Audio Events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => {
      if (!audioCtxRef.current) initAudio()
      isReconnectingRef.current = false
      setIsPlaying(true)
      setIsLoading(false)
      setStatus('En vivo')
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
    }
    const onWait = () => { setIsLoading(true); setStatus('Cargando...') }
    const onCanPlay = () => setIsLoading(false)
    const onError = () => {
      if (isReconnectingRef.current) return
      if (!wasPlayingRef.current) { setIsPlaying(false); setIsLoading(false); setStatus('Error - Toca para reintentar'); return }
      setIsPlaying(false)
      setStatus('Reconectando...')
      setIsLoading(true)
      isReconnectingRef.current = true
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
    return () => {
      audio.removeEventListener('playing', onPlay)
      audio.removeEventListener('waiting', onWait)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('error', onError)
    }
  }, [initAudio])

  // Reconnect online
  useEffect(() => {
    const onOnline = () => {
      const audio = audioRef.current
      if (wasPlayingRef.current && !isReconnectingRef.current && audio?.paused) {
        setStatus('Reconectando...')
        setIsLoading(true)
        isReconnectingRef.current = true
        audio.src = STREAM_URL + '?t=' + Date.now()
        audio.load()
        audio.play().catch(() => { isReconnectingRef.current = false; setStatus('Error'); setIsLoading(false) })
      }
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // Autoplay (puede fallar por política del navegador; el usuario puede tocar play)
  // IMPORTANTE: NO inicializar Web Audio aquí. El AudioContext.resume() colgaría
  // sin gesture del usuario. Solo intentar audio.play() directo.
  useEffect(() => {
    if (!mounted) return
    const t = setTimeout(() => {
      const audio = audioRef.current
      if (!audio) return
      audio.src = STREAM_URL
      audio.load()
      audio.play().then(() => {
        // Si autoplay funciona, inicializar Web Audio
        if (!audioCtxRef.current) initAudio()
        if (audioCtxRef.current?.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {})
        }
        setIsPlaying(true)
        setStatus('En vivo')
      }).catch(() => {
        // Autoplay bloqueado — el usuario debe tocar play
        setStatus('Toca para reproducir')
        setIsLoading(false)
      })
    }, 500)
    return () => clearTimeout(t)
  }, [mounted, initAudio])

  // Volume
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume }, [volume])

  // Sleep Timer
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

  // ==================== VISUALIZADOR LUNA PLAYER (10 modos) ====================
  const drawLuna = useCallback((canvas: HTMLCanvasElement, fullscreen = false) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const m = fullscreen ? modeFsRef.current : modeRef.current
    const analyser = analyserRef.current

    // Limpiar
    ctx.clearRect(0, 0, W, H)

    // Modo desactivado: solo texto
    if (m === 0) {
      ctx.fillStyle = colors.muted
      ctx.font = fullscreen ? '22px system-ui' : '12px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Visualizador desactivado', cx, cy)
      return
    }

    // Si no hay analyser, dibujar barras estáticas decorativas
    let data: Uint8Array
    let bufLen: number
    let avg = 0
    if (analyser) {
      bufLen = analyser.frequencyBinCount
      data = new Uint8Array(bufLen)
      analyser.getByteFrequencyData(data)
      avg = data.reduce((a, b) => a + b, 0) / bufLen
    } else {
      // Datos simulados cuando no hay audio
      bufLen = 64
      data = new Uint8Array(bufLen)
      const t = Date.now() / 1000
      for (let i = 0; i < bufLen; i++) {
        data[i] = Math.max(0, Math.floor(60 + 40 * Math.sin(t * 2 + i * 0.3) + 20 * Math.sin(t * 4.7 + i * 0.7)))
      }
      avg = 80
    }
    const intensity = avg / 255  // 0..1

    // Actualizar escala del logo (palpita al ritmo del audio)
    const targetScale = 1 + intensity * 0.18
    logoScaleRef.current = logoScaleRef.current + (targetScale - logoScaleRef.current) * 0.25

    // Color del visualizador
    const primary = colors.primary
    const bright = colors.bright
    const accent = colors.accent

    // Aro base decorativo (siempre visible)
    ctx.save()
    ctx.strokeStyle = `${primary}30`
    ctx.lineWidth = 1
    ctx.setLineDash([4, 6])
    ctx.beginPath()
    ctx.arc(cx, cy, Math.min(W, H) * 0.42, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    // Glow radial
    const glowR = Math.min(W, H) * 0.45
    const glowGrad = ctx.createRadialGradient(cx, cy, glowR * 0.3, cx, cy, glowR)
    glowGrad.addColorStop(0, `${primary}40`)
    glowGrad.addColorStop(1, `${primary}00`)
    ctx.fillStyle = glowGrad
    ctx.beginPath()
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2)
    ctx.fill()

    // Aro pulsante
    const ringR = Math.min(W, H) * 0.4
    ctx.strokeStyle = `${primary}80`
    ctx.lineWidth = 2 + intensity * 4
    ctx.beginPath()
    ctx.arc(cx, cy, ringR + intensity * 8, 0, Math.PI * 2)
    ctx.stroke()

    // ===== 10 MODOS LUNA PLAYER =====
    const innerR = Math.min(W, H) * 0.22  // radio del logo
    const baseR = Math.min(W, H) * 0.34   // radio base de las barras

    if (m === 1) {
      // Línea de espectro: línea continua alrededor del círculo
      ctx.beginPath()
      const n = bufLen
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2
        const v = data[i] / 255
        const r = baseR + v * Math.min(W, H) * 0.12
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = bright
      ctx.lineWidth = 2
      ctx.shadowColor = primary
      ctx.shadowBlur = 12
      ctx.stroke()
      ctx.shadowBlur = 0
    } else if (m === 2) {
      // Área de espectro: rellena el área bajo la línea
      ctx.beginPath()
      const n = bufLen
      ctx.moveTo(cx + Math.cos(-Math.PI / 2) * innerR, cy + Math.sin(-Math.PI / 2) * innerR)
      for (let i = 0; i <= n; i++) {
        const idx = i % n
        const angle = (idx / n) * Math.PI * 2 - Math.PI / 2
        const v = data[idx] / 255
        const r = innerR + v * Math.min(W, H) * 0.18
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
      }
      ctx.closePath()
      const areaGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, baseR + Math.min(W, H) * 0.18)
      areaGrad.addColorStop(0, `${primary}cc`)
      areaGrad.addColorStop(1, `${accent}55`)
      ctx.fillStyle = areaGrad
      ctx.fill()
    } else if (m === 3) {
      // Barras finas: muchas barras radiales delgadas
      const n = Math.min(bufLen, 96)
      const step = (Math.PI * 2) / n
      for (let i = 0; i < n; i++) {
        const idx = Math.floor((i / n) * bufLen)
        const v = data[idx] / 255
        const angle = i * step - Math.PI / 2
        const r1 = innerR + 4
        const r2 = r1 + v * Math.min(W, H) * 0.18 + 2
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
        ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2)
        ctx.strokeStyle = primary
        ctx.lineWidth = 2
        ctx.stroke()
      }
    } else if (m === 4) {
      // Curvas rellenas: ondas concéntricas suaves
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath()
        const n = 64
        const phase = Date.now() / (800 + layer * 200)
        for (let i = 0; i <= n; i++) {
          const angle = (i / n) * Math.PI * 2
          const idx = Math.floor((i / n) * bufLen) % bufLen
          const v = data[idx] / 255
          const r = innerR + 10 + layer * 18 + v * Math.min(W, H) * 0.12 + Math.sin(phase + angle * 3) * 4
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fillStyle = layer === 0 ? `${primary}aa` : layer === 1 ? `${bright}66` : `${accent}33`
        ctx.fill()
      }
    } else if (m === 5) {
      // Curvas trazadas: solo contorno, varias líneas
      for (let layer = 0; layer < 4; layer++) {
        ctx.beginPath()
        const n = 96
        const phase = Date.now() / (700 + layer * 150)
        for (let i = 0; i <= n; i++) {
          const angle = (i / n) * Math.PI * 2
          const idx = Math.floor((i / n) * bufLen) % bufLen
          const v = data[idx] / 255
          const r = innerR + 8 + layer * 14 + v * Math.min(W, H) * 0.10 + Math.sin(phase + angle * (2 + layer)) * 5
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = layer === 0 ? primary : layer === 1 ? bright : layer === 2 ? accent : `${primary}66`
        ctx.lineWidth = 2
        ctx.shadowColor = primary
        ctx.shadowBlur = 8
        ctx.stroke()
      }
      ctx.shadowBlur = 0
    } else if (m === 6) {
      // Barras en espejo: barras que crecen hacia adentro y hacia afuera
      const n = Math.min(bufLen, 72)
      const step = (Math.PI * 2) / n
      for (let i = 0; i < n; i++) {
        const idx = Math.floor((i / n) * bufLen)
        const v = data[idx] / 255
        const angle = i * step - Math.PI / 2
        const r1 = baseR + v * Math.min(W, H) * 0.10
        const r2 = baseR + Math.min(W, H) * 0.18 - v * Math.min(W, H) * 0.08
        const grad = ctx.createLinearGradient(
          cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2,
          cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1
        )
        grad.addColorStop(0, primary)
        grad.addColorStop(1, bright)
        ctx.strokeStyle = grad
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
        ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2)
        ctx.stroke()
      }
    } else if (m === 7) {
      // Partículas orbitales
      const t = Date.now() / 1000
      const n = 60
      for (let i = 0; i < n; i++) {
        const idx = Math.floor((i / n) * bufLen)
        const v = data[idx] / 255
        const baseAngle = (i / n) * Math.PI * 2 + t * 0.4
        const r = innerR + 20 + v * Math.min(W, H) * 0.18 + Math.sin(t * 2 + i) * 6
        const x = cx + Math.cos(baseAngle) * r
        const y = cy + Math.sin(baseAngle) * r
        const size = 1.5 + v * 4
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = i % 3 === 0 ? bright : i % 3 === 1 ? primary : accent
        ctx.shadowColor = primary
        ctx.shadowBlur = 6
        ctx.fill()
      }
      ctx.shadowBlur = 0
    } else if (m === 8) {
      // Espectro 3D: anillos concéntricos con perspectiva
      const t = Date.now() / 1000
      for (let i = 16; i >= 0; i--) {
        const p = i / 16
        const z = (p + t * 0.3) % 1
        const r = innerR + 6 + z * Math.min(W, H) * 0.22
        const alpha = (1 - z) * 0.9
        const idx = Math.floor(p * bufLen) % bufLen
        const v = data[idx] / 255
        ctx.beginPath()
        const sides = 48
        for (let j = 0; j <= sides; j++) {
          const angle = (j / sides) * Math.PI * 2 + t * 0.2 + v * 0.3
          const wobble = 1 + Math.sin(angle * 3 + t * 2) * (0.04 + v * 0.08)
          const x = cx + Math.cos(angle) * r * wobble
          const y = cy + Math.sin(angle) * r * wobble
          if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = `hsla(43, 80%, ${55 + alpha * 25}%, ${alpha * (0.4 + intensity * 0.6)})`
        ctx.lineWidth = 1.5 + v * 2
        ctx.stroke()
      }
    } else if (m === 9) {
      // Medidor VU estéreo: dos semicírculos (L arriba, R abajo)
      const aL = analyserLRef.current, aR = analyserRRef.current
      let dL: Uint8Array, dR: Uint8Array
      if (aL && aR) {
        dL = new Uint8Array(aL.frequencyBinCount)
        dR = new Uint8Array(aR.frequencyBinCount)
        aL.getByteFrequencyData(dL)
        aR.getByteFrequencyData(dR)
      } else {
        dL = data; dR = data
      }
      // Canal L (arriba)
      const n = Math.min(dL.length, 48)
      for (let i = 0; i < n; i++) {
        const v = dL[i] / 255
        const angle = Math.PI + (i / (n - 1)) * Math.PI
        const r1 = innerR + 6
        const r2 = r1 + v * Math.min(W, H) * 0.16
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
        ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2)
        ctx.strokeStyle = '#00CED1'
        ctx.lineWidth = 3
        ctx.stroke()
      }
      // Canal R (abajo)
      const nR = Math.min(dR.length, 48)
      for (let i = 0; i < nR; i++) {
        const v = dR[i] / 255
        const angle = (i / (nR - 1)) * Math.PI
        const r1 = innerR + 6
        const r2 = r1 + v * Math.min(W, H) * 0.16
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
        ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2)
        ctx.strokeStyle = bright
        ctx.lineWidth = 3
        ctx.stroke()
      }
    } else if (m === 10) {
      // Barras gruesas: pocas barras pero anchas
      const n = 32
      const step = (Math.PI * 2) / n
      for (let i = 0; i < n; i++) {
        const idx = Math.floor((i / n) * bufLen)
        const v = data[idx] / 255
        const angle = i * step - Math.PI / 2
        const r1 = innerR + 4
        const r2 = r1 + v * Math.min(W, H) * 0.22
        const x1 = cx + Math.cos(angle) * r1
        const y1 = cy + Math.sin(angle) * r1
        const x2 = cx + Math.cos(angle) * r2
        const y2 = cy + Math.sin(angle) * r2
        const grad = ctx.createLinearGradient(x1, y1, x2, y2)
        grad.addColorStop(0, primary)
        grad.addColorStop(1, bright)
        ctx.strokeStyle = grad
        ctx.lineWidth = 6
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    }

    // Logo en el centro, escalado al ritmo del audio
    const img = logoImgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      const logoSize = innerR * 1.6 * logoScaleRef.current
      ctx.save()
      // Sombra/glow detrás del logo
      ctx.shadowColor = primary
      ctx.shadowBlur = 8 + intensity * 14
      ctx.drawImage(img, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize)
      ctx.restore()
    } else {
      // Placeholder circular mientras carga
      ctx.fillStyle = `${primary}30`
      ctx.beginPath()
      ctx.arc(cx, cy, innerR * 0.7 * logoScaleRef.current, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [colors])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      drawLuna(canvas, false)
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [drawLuna])

  useEffect(() => {
    if (!showFs) return
    const canvas = canvasFsRef.current
    if (!canvas) return
    const animate = () => {
      animFsRef.current = requestAnimationFrame(animate)
      drawLuna(canvas, true)
    }
    animate()
    return () => cancelAnimationFrame(animFsRef.current)
  }, [showFs, drawLuna])

  // Pre-cargar el logo
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/imagenes/Logo-9-de-julio.webp'
    img.onload = () => { logoImgRef.current = img }
    img.onerror = () => {
      // Fallback PNG
      const img2 = new Image()
      img2.src = '/imagenes/Logo-9-de-julio.png'
      img2.onload = () => { logoImgRef.current = img2 }
    }
  }, [])

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (isPlaying) pause(); else play()
      } else if (e.code === 'KeyF') {
        setShowFs(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPlaying, play, pause])

  // Cleanup — guardar contra double-close (HMR / StrictMode)
  useEffect(() => {
    return () => {
      const ctx = audioCtxRef.current
      if (ctx) {
        audioCtxRef.current = null
        // Solo cerrar si NO está ya cerrado (evita "Can't close an AudioContext twice")
        if (ctx.state !== 'closed') {
          try {
            const p = ctx.close()
            // Manejar tanto errors sync como async (Promise rejection)
            if (p && typeof p.catch === 'function') p.catch(() => {})
          } catch { /* ok — contexto ya cerrado */ }
        }
      }
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Helpers
  const cycleMode = useCallback(() => {
    const newMode = modeRef.current >= 10 ? 0 : modeRef.current + 1
    modeRef.current = newMode
    modeFsRef.current = newMode
    setMode(newMode)
  }, [])

  const toggleDark = useCallback(() => {
    const n = !dark
    setDark(n)
    localStorage.setItem('fm9_dark', String(n))
  }, [dark])

  const cycleTheme = useCallback(() => {
    const n = (themeIdx + 1) % THEMES.length
    setThemeIdx(n)
    localStorage.setItem('fm9_theme', String(n))
  }, [themeIdx])

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(RADIO_URL)
      alert('¡URL copiada!')
    } catch { /* ok */ }
    setShowShare(false)
  }

  const openShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400')
    setShowShare(false)
  }

  if (!mounted) return null

  // Tamaño del visualizador (responsive, que entre sin scroll en móvil)
  const vizSize = 'min(38vmin, 280px)'
  const vizPx = 280

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100dvh',
        // Fondo: imagen de fondo 9:16 cubriendo toda la pantalla + overlay scrim para legibilidad
        backgroundImage: `linear-gradient(${ui.scrim1}, ${ui.scrim2}), url(/imagenes/Background_app.jpeg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: ui.text,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 10px calc(env(safe-area-inset-bottom, 0px) + 8px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" playsInline style={{ display: 'none' }} />

      {/* Offline banner */}
      {offline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#dc2626', color: 'white', padding: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-flex' }}>{UIIcons.wifiOff(14, 'white')}</span>
          <span>Sin conexión</span>
        </div>
      )}

      {/* Install Prompt */}
      {installPrompt && installable && (
        <div style={{ position: 'fixed', top: offline ? '28px' : '8px', left: '8px', right: '8px', background: colors.primary, color: '#1a1a1a', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex' }}>{UIIcons.smartphone(18, '#1a1a1a')}</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Instalar App</div>
              <div style={{ fontSize: '10px', opacity: 0.85 }}>Agregá FM 9 a tu pantalla</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={installApp} style={{ background: '#1a1a1a', color: colors.primary, border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {UIIcons.download(12, colors.primary)}
              <span>Instalar</span>
            </button>
            <button onClick={() => { setInstallPrompt(false); localStorage.setItem('fm9_install_dismissed', 'true') }} style={{ background: 'transparent', border: 'none', color: '#1a1a1a', cursor: 'pointer', padding: '4px', display: 'inline-flex' }}>{UIIcons.close(16, '#1a1a1a')}</button>
          </div>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', paddingTop: installPrompt ? '55px' : '0' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          {/* Dark mode toggle + theme picker */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={toggleDark} aria-label="Cambiar tema" style={{ background: ui.pillBg, border: `1px solid ${colors.primary}50`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
              {dark ? UIIcons.sun(18, colors.primary) : UIIcons.moon(18, colors.primary)}
            </button>
            <button onClick={cycleTheme} aria-label="Color" style={{ background: theme.primary, border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {UIIcons.palette(18, '#ffffff')}
            </button>
          </div>

          {/* Weather */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: ui.pillBg, padding: '4px 10px', borderRadius: '14px', color: ui.text, border: `1px solid ${colors.primary}30` }}>
            {weather ? (
              <>
                <span style={{ display: 'inline-flex' }}>{UIIcons[weather.icon](16, colors.primary)}</span>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>{weather.t}°</span>
              </>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {UIIcons.sunCloud(14, colors.muted)}
                <span style={{ fontSize: '11px', color: colors.muted }}>--°</span>
              </span>
            )}
          </div>

          {/* Stats + Timer */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowStats(s => !s)} aria-label="Estadísticas" style={{ background: ui.pillBg, border: `1px solid ${colors.primary}50`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
              {UIIcons.stats(18, colors.primary)}
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowTimer(t => !t)} aria-label="Timer" style={{ background: sleepTimer ? colors.primary : ui.pillBg, color: sleepTimer ? '#ffffff' : colors.primary, border: `1px solid ${colors.primary}50`, borderRadius: '8px', height: '32px', padding: '0 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                {UIIcons.clock(14, sleepTimer ? '#ffffff' : colors.primary)}
                <span>{sleepDisplay || 'Timer'}</span>
              </button>
              {showTimer && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: ui.dropdownBg, border: `1px solid ${colors.primary}50`, borderRadius: '8px', padding: '6px', zIndex: 100, minWidth: '110px', backdropFilter: 'blur(8px)' }}>
                  {[15, 30, 45, 60, 90].map(mn => (
                    <button key={mn} onClick={() => setSleep(mn)} style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', color: ui.text, padding: '6px 8px', textAlign: 'left', cursor: 'pointer', fontSize: '11px', borderRadius: '4px' }}>{mn} min</button>
                  ))}
                  <button onClick={() => setSleep(0)} style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', color: colors.primary, padding: '6px 8px', textAlign: 'left', cursor: 'pointer', fontSize: '11px', borderRadius: '4px' }}>Cancelar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATS PANEL ===== */}
      {showStats && (
        <div style={{ width: '100%', maxWidth: '360px', background: ui.panelBg, borderRadius: '12px', padding: '12px', marginBottom: '6px', border: `1px solid ${colors.primary}30`, backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>{stats.todayMinutes} min</div>
              <div style={{ fontSize: '9px', color: colors.muted }}>Hoy</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</div>
              <div style={{ fontSize: '9px', color: colors.muted }}>Total</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-flex' }}>{UIIcons.flame(16, '#ff6b35')}</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>{stats.streak}</span>
              </div>
              <div style={{ fontSize: '9px', color: colors.muted }}>Racha</div>
            </div>
          </div>
          {stats.achievements.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', paddingTop: '6px', borderTop: `1px solid ${colors.primary}20` }}>
              {stats.achievements.map(id => ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean).map(a => {
                const iconMap: Record<string, (s: number, c: string) => React.ReactElement> = {
                  first: UIIcons.music,
                  hour: UIIcons.clock,
                  fan: UIIcons.headphones,
                  streak3: UIIcons.flame,
                  streak7: UIIcons.trophy,
                }
                return (
                  <span key={a!.id} title={a!.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: `${colors.primary}20`, borderRadius: '12px', fontSize: '10px', color: colors.primary, border: `1px solid ${colors.primary}40` }}>
                    {iconMap[a!.id]?.(12, colors.primary)}
                    <span>{a!.name}</span>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== VISUALIZADOR CIRCULAR LUNA PLAYER ===== */}
      <div
        onClick={cycleMode}
        style={{
          width: vizSize,
          height: vizSize,
          maxWidth: '280px',
          maxHeight: '280px',
          position: 'relative',
          cursor: 'pointer',
          flex: '0 0 auto',
        }}
      >
        <canvas
          ref={canvasRef}
          width={vizPx}
          height={vizPx}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
        {/* Etiqueta de modo */}
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: ui.btnOverlayBg,
          padding: '3px 10px',
          borderRadius: '10px',
          fontSize: '9px',
          color: ui.text,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          border: `1px solid ${colors.primary}40`,
        }}>
          {VISUALIZER_MODES[mode].name}
        </div>
        {/* Fullscreen button */}
        <button
          onClick={e => { e.stopPropagation(); setShowFs(true) }}
          aria-label="Pantalla completa"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: ui.btnOverlayBg,
            border: `1px solid ${colors.primary}40`,
            borderRadius: '6px',
            padding: '4px',
            cursor: 'pointer',
            display: 'inline-flex',
            color: colors.primary,
          }}
        >
          {UIIcons.expand(12, colors.primary)}
        </button>
      </div>

      {/* ===== TÍTULO ===== */}
      <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
        <h1 style={{ fontSize: 'clamp(20px, 5vmin, 24px)', fontWeight: 'bold', margin: '4px 0 2px 0', textShadow: ui.h1Shadow, color: ui.text }}>FM 9 de Julio</h1>
        <p style={{ fontSize: '14px', color: colors.primary, margin: 0, fontWeight: '700', textShadow: ui.textShadow }}>102.3 MHz</p>
        <p style={{ fontSize: '11px', color: ui.textSoft, margin: '1px 0 0 0', textShadow: ui.textShadow }}>Tres Isletas, Chaco</p>
      </div>

      {/* ===== STATUS + PLAY ===== */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', gap: '10px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '12px', background: isPlaying ? ui.pillBgActive : ui.pillBg, border: `1px solid ${isPlaying ? colors.primary : ui.pillBorder}` }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPlaying ? '#4ade80' : colors.muted, animation: isPlaying ? 'fm9blink 1s infinite' : 'none' }} />
          <span style={{ fontSize: '11px', fontWeight: '500', color: ui.text }}>{status}</span>
        </div>
        <button
          onClick={() => isPlaying ? pause() : play()}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 6px 25px ${colors.primary}80, 0 0 12px ${colors.primary}40`,
            transition: 'transform 0.15s ease',
            transform: isPlaying ? 'scale(1)' : 'scale(1)',
          }}
        >
          {isLoading ? (
            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'fm9spin 1s linear infinite' }} />
          ) : isPlaying ? (
            UIIcons.pause(28, 'white')
          ) : (
            UIIcons.play(28, 'white')
          )}
        </button>
      </div>

      {/* ===== VOLUMEN (centrado) ===== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 16px',
        background: 'rgba(218, 165, 32, 0.12)',
        borderRadius: '20px',
        border: `1px solid ${colors.primary}40`,
        width: '100%',
        maxWidth: '280px',
        margin: '0 auto',
        flex: '0 0 auto',
      }}>
        <span style={{ display: 'inline-flex', color: colors.primary, flexShrink: 0 }}>{UIIcons.volume(18, colors.primary)}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          aria-label="Volumen"
          style={{
            flex: 1,
            height: '5px',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: `linear-gradient(to right, ${colors.primary} ${volume * 100}%, ${colors.primary}30 ${volume * 100}%)`,
            borderRadius: '3px',
            cursor: 'pointer',
            outline: 'none',
          }}
        />
        <span style={{ color: colors.primary, fontSize: '11px', fontWeight: 'bold', minWidth: '32px', textAlign: 'right' }}>{Math.round(volume * 100)}%</span>
      </div>

      {/* ===== BOTONES DE ACCIÓN (sin "Saludo") ===== */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '14px', flex: '0 0 auto' }}>
        <a href="https://wa.me/543644503323" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', width: '52px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(37, 211, 102, 0.4)' }}>{UIIcons.whatsapp(20, 'white')}</div>
          <span style={{ color: ui.textSoft, fontSize: '9px' }}>WhatsApp</span>
        </a>
        <a href="https://www.facebook.com/fm9dejuliotresisletas" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', width: '52px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(24, 119, 242, 0.4)' }}>{UIIcons.facebook(20, 'white')}</div>
          <span style={{ color: ui.textSoft, fontSize: '9px' }}>Facebook</span>
        </a>
        <button onClick={() => setShowShare(true)} aria-label="Compartir" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '0', width: '52px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${colors.primary}80` }}>{UIIcons.share(18, 'white')}</div>
          <span style={{ color: ui.textSoft, fontSize: '9px' }}>Compartir</span>
        </button>
        <a href="https://play.google.com/store/apps/details?id=com.radioshd.fm9dejulio" target="_blank" rel="noopener noreferrer" aria-label="App" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', width: '52px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #00C4FF 0%, #7B2FFF 50%, #F50057 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(123, 47, 255, 0.4)' }}>{UIIcons.app(18, 'white')}</div>
          <span style={{ color: ui.textSoft, fontSize: '9px' }}>App</span>
        </a>
      </div>

      {/* ===== CRÉDITOS ===== */}
      <div style={{ textAlign: 'center', flex: '0 0 auto', paddingTop: '4px' }}>
        <p style={{ color: colors.primary, fontSize: '13px', fontStyle: 'italic', margin: '0 0 6px 0', fontWeight: '600', textShadow: ui.textShadow }}>"La radio verdad... La radio solidaria..."</p>
        <div style={{ fontSize: '13px', color: ui.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '4px' }}>
          <span>Diseñado por</span>
          <a
            href="https://catbit.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-catbit"
            style={{ textDecoration: 'none', color: 'inherit', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="catbit-word"><span className="catbit-cat">Cat</span><span className="catbit-bit">Bit</span></span>
            <span className="catbit-logo"></span>
          </a>
          <span className="footer-sep">|</span>
          <span>Director: Claudio Gustavo Tiberio</span>
        </div>
      </div>

      {/* ===== MODAL COMPARTIR ===== */}
      {showShare && (
        <div
          style={{ position: 'fixed', inset: 0, background: ui.modalBg, zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowShare(false)}
        >
          <div
            style={{ background: ui.sheetBg, borderRadius: '20px 20px 0 0', padding: '20px', width: '100%', maxWidth: '400px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', border: `1px solid ${colors.primary}40` }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'center', color: ui.text }}>Compartir</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {SHARE_OPTIONS.map(opt => (
                <button
                  key={opt.name}
                  onClick={() => opt.action === 'copy' ? copyUrl() : openShare(opt.url(RADIO_URL, SHARE_TEXT))}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{opt.icon(22, 'white')}</div>
                  <span style={{ color: ui.textSoft, fontSize: '10px' }}>{opt.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowShare(false)}
              style={{ width: '100%', marginTop: '15px', padding: '12px', background: ui.pillBg, border: `1px solid ${colors.primary}40`, borderRadius: '10px', color: ui.text, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {UIIcons.close(16, ui.text)}
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== FULLSCREEN VISUALIZER MODAL ===== */}
      {showFs && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <canvas
            ref={canvasFsRef}
            width={typeof window !== 'undefined' ? window.innerWidth : 400}
            height={typeof window !== 'undefined' ? window.innerHeight : 800}
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
          />
          <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, textAlign: 'center', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
            <h2 style={{ fontSize: '22px', margin: 0, color: colors.primary }}>FM 9 de Julio</h2>
            <p style={{ fontSize: '12px', margin: '3px 0', color: '#ddd' }}>102.3 MHz - Tres Isletas, Chaco</p>
          </div>
          <button
            onClick={() => setShowFs(false)}
            aria-label="Cerrar"
            style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', border: `1px solid ${colors.primary}40`, borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: colors.primary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {UIIcons.close(20, colors.primary)}
          </button>
          <button
            onClick={cycleMode}
            style={{ position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', border: `1px solid ${colors.primary}40`, borderRadius: '15px', padding: '8px 15px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
          >
            {VISUALIZER_MODES[mode].name}
          </button>
        </div>
      )}

      {/* CSS global + animaciones + estilos CatBit */}
      <style jsx global>{`
        @keyframes fm9blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fm9spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          margin: 0; padding: 0;
          background: #0d0d0d;
          color: #fff;
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          overscroll-behavior: none;
          font-family: system-ui, -apple-system, sans-serif;
        }
        /* Slider thumb - todos los navegadores */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: ${colors.primary}; cursor: pointer;
          box-shadow: 0 0 8px ${colors.primary}80;
          border: 2px solid ${colors.bright};
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: ${colors.primary}; cursor: pointer;
          box-shadow: 0 0 8px ${colors.primary}80;
          border: 2px solid ${colors.bright};
        }

        /* ===== Estilos CatBit (footer) ===== */
        .footer-catbit { text-decoration: none; color: inherit; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: opacity .2s ease; }
        .footer-catbit:hover { opacity: 0.85; }
        .footer-sep { margin: 0 8px; opacity: 0.5; color: inherit; }
        .catbit-word {
          display: inline-flex;
          align-items: baseline;
          font-size: 16px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 8px;
          background: rgba(13, 13, 13, 0.85);
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        .catbit-cat { color: #ffffff; }
        .catbit-bit { color: #39FF88; }
        .catbit-logo {
          width: 36px; height: 36px;
          display: inline-block;
          margin-left: 6px;
          background-image: url("https://catbit.com.ar/images/logo-catbit.png");
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          padding: 3px;
          background-color: rgba(255,255,255,0.85);
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255,255,255,0.6), 0 0 3px rgba(255,255,255,0.9);
          vertical-align: middle;
          transition: transform .25s ease, box-shadow .25s ease, background-color .25s ease;
        }
        .footer-catbit:hover .catbit-logo {
          transform: scale(1.12) rotate(-5deg);
          box-shadow: 0 0 16px rgba(255,255,255,0.8), 0 0 6px rgba(255,255,255,1);
          background-color: rgba(255,255,255,0.95);
        }
      `}</style>
    </div>
  )
}

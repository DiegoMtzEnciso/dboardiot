import { useEffect, useState, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

// Tema claro/oscuro: se guarda en localStorage y se aplica con data-theme en <html>
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('petcare-theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F4F7FB' : '#060913')
    try { localStorage.setItem('petcare-theme', theme) } catch { /* sin almacenamiento */ }
  }, [theme])
  // Con View Transitions el nuevo tema se revela como un círculo que crece desde el botón.
  // Sin soporte (o con movimiento reducido) el cambio es un fundido de colores o instantáneo.
  const toggle = (origen) => {
    const html = document.documentElement
    const next = theme === 'dark' ? 'light' : 'dark'
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const aplicar = () => { html.dataset.theme = next; flushSync(() => setTheme(next)) }

    if (!reducido && origen && typeof document.startViewTransition === 'function') {
      const r = origen.getBoundingClientRect()
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      const radio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      const vt = document.startViewTransition(aplicar)
      vt.ready.then(() => {
        html.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
          { duration: 650, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      }).catch(() => {})
      return
    }
    if (!reducido) {
      html.classList.add('theme-anim')
      setTimeout(() => html.classList.remove('theme-anim'), 320)
    }
    setTheme(next)
  }
  return [theme, toggle]
}

export function useMedia(query) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) },
    () => window.matchMedia(query).matches,
    () => true,
  )
}


// Hora actual en minutos desde medianoche; se actualiza cada 30 s
export function useNowMin() {
  const get = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() }
  const [m, setM] = useState(get)
  useEffect(() => { const id = setInterval(() => setM(get()), 30000); return () => clearInterval(id) }, [])
  return m
}

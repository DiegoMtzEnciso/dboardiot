import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
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

// ───────── Cambio de pestañas con gesto horizontal (táctil, mouse y trackpad) ─────────
const UMBRAL_PX = 60 // distancia mínima de arrastre (táctil y mouse)
const UMBRAL_WHEEL = 90 // desplazamiento horizontal acumulado del trackpad
const INTERACTIVO = 'button,input,select,textarea,a,label,summary,[role=switch],[role=listbox],[role=slider],[contenteditable=true],[data-no-swipe]'

// Devuelve true si el gesto empieza dentro de un área con scroll horizontal propio
function dentroDeScrollHorizontal(objetivo, raiz) {
  for (let n = objetivo; n && n !== raiz; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth + 2) {
      const ox = getComputedStyle(n).overflowX
      if (ox === 'auto' || ox === 'scroll') return true
    }
  }
  return false
}

// `ref` = contenedor que recibe el gesto (con la clase touch-pan-y para que el scroll vertical siga nativo).
// `onSwipe(+1)` = pestaña siguiente; `onSwipe(-1)` = pestaña anterior.
// Soporta: dedo (móvil/iPad), arrastre con mouse y deslizamiento horizontal con dos dedos en el trackpad.
export function useSwipeTabs({ ref, enabled = true, onSwipe }) {
  const cb = useRef(onSwipe)
  useEffect(() => { cb.current = onSwipe })

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return undefined
    const reducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let toque = null
    let wheel = { acum: 0, fin: 0, bloqueo: 0 }

    const reponer = () => {
      el.style.transition = reducido() ? 'none' : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms cubic-bezier(0.22, 1, 0.36, 1)'
      el.style.transform = ''
      el.style.opacity = ''
    }
    // El contenido acompaña al gesto con resistencia (máx. 48 px)
    const seguir = (dx) => {
      if (reducido()) return
      const d = Math.max(-48, Math.min(48, dx * 0.35))
      el.style.transition = 'none'
      el.style.transform = `translateX(${d}px)`
      el.style.opacity = String(1 - Math.min(0.15, Math.abs(d) / 320))
    }

    // ── Puntero: dedo, lápiz o mouse ──
    const abajo = (e) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
      if (e.target.closest?.(INTERACTIVO) || dentroDeScrollHorizontal(e.target, el)) { toque = null; return }
      toque = { id: e.pointerId, tipo: e.pointerType, x: e.clientX, y: e.clientY, eje: null }
    }
    const mover = (e) => {
      if (!toque || e.pointerId !== toque.id) return
      const dx = e.clientX - toque.x
      const dy = e.clientY - toque.y
      if (!toque.eje) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
        toque.eje = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'h' : 'v' // el gesto se bloquea en un eje
        if (toque.eje === 'h' && toque.tipo === 'mouse') { // con mouse: seguir el arrastre y no seleccionar texto
          try { el.setPointerCapture(e.pointerId) } catch { /* sin captura */ }
          document.body.style.userSelect = 'none'
        }
      }
      if (toque.eje === 'h') seguir(dx)
    }
    const terminar = (e, cancelado) => {
      if (!toque || e.pointerId !== toque.id) return
      const dx = e.clientX - toque.x
      const dy = e.clientY - toque.y
      const valido = !cancelado && toque.eje === 'h' && Math.abs(dx) >= UMBRAL_PX && Math.abs(dx) > Math.abs(dy) * 1.5
      toque = null
      document.body.style.userSelect = ''
      reponer()
      if (valido) cb.current(dx < 0 ? 1 : -1)
    }
    const arriba = (e) => terminar(e, false)
    const cancelar = (e) => terminar(e, true)

    // ── Trackpad: deslizamiento horizontal con dos dedos (eventos wheel con deltaX) ──
    const rueda = (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) return // vertical o zoom: no es para nosotros
      if (dentroDeScrollHorizontal(e.target, el) || e.target.closest?.('[role=listbox],[data-no-swipe]')) return
      e.preventDefault() // evita el gesto "atrás/adelante" del navegador
      const ahora = Date.now()
      if (ahora < wheel.bloqueo) return // la inercia del trackpad no debe encadenar cambios
      wheel.acum = ahora - wheel.fin > 220 ? e.deltaX : wheel.acum + e.deltaX
      wheel.fin = ahora
      seguir(-wheel.acum)
      clearTimeout(wheel.t)
      wheel.t = setTimeout(() => { wheel.acum = 0; reponer() }, 180)
      if (Math.abs(wheel.acum) >= UMBRAL_WHEEL) {
        const paso = wheel.acum > 0 ? 1 : -1
        wheel.acum = 0
        wheel.bloqueo = ahora + 700
        clearTimeout(wheel.t)
        reponer()
        cb.current(paso)
      }
    }

    el.addEventListener('pointerdown', abajo)
    el.addEventListener('pointermove', mover)
    el.addEventListener('pointerup', arriba)
    el.addEventListener('pointercancel', cancelar)
    el.addEventListener('wheel', rueda, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', abajo)
      el.removeEventListener('pointermove', mover)
      el.removeEventListener('pointerup', arriba)
      el.removeEventListener('pointercancel', cancelar)
      el.removeEventListener('wheel', rueda)
      clearTimeout(wheel.t)
      document.body.style.userSelect = ''
      el.style.transform = ''
      el.style.opacity = ''
      el.style.transition = ''
    }
  }, [ref, enabled])
}

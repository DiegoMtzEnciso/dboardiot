import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

// Cambio de tema: la onda circular nace en el botón y el contenido se desenfoca (2.5 px) y encoge (0.996) a la vez.
// Con View Transitions (Chrome, Edge, Safari 18+) la onda es el clip-path de ::view-transition-new(root) y el desenfoque
// está en ::view-transition-group(root) (index.css). Sin ellas, una capa con el aspecto nuevo se revela con el mismo clip-path.
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const MS = 400
const KEYS_CRISTAL = [
  { filter: 'blur(0px)', transform: 'scale(1)' },
  { filter: 'blur(2.5px)', transform: 'scale(0.996)', offset: 0.5 },
  { filter: 'blur(0px)', transform: 'scale(1)' },
]
const circulo = (x, y, r) => `circle(${r}px at ${x}px ${y}px)`
let terminarCapa = null
let destino = null // tema pedido que aún no se aplicó (la View Transition aplica el cambio en el siguiente fotograma)

// Mientras dura una View Transition el navegador dirige los toques a <html>, no al control que está debajo.
// Si alguien pulsa en ese momento, la transición termina ya y el clic se entrega a su control.
function conservarClics(vt) {
  const html = document.documentElement
  let pulsado = false
  const abajo = (e) => {
    if (e.target !== html) return
    pulsado = true
    vt.skipTransition()
  }
  const clic = (e) => {
    if (!pulsado || e.target !== html) return
    pulsado = false
    document.elementFromPoint(e.clientX, e.clientY)?.closest('button, summary, a, label')?.click()
  }
  document.addEventListener('pointerdown', abajo, true)
  document.addEventListener('click', clic, true)
  const fin = () => {
    document.removeEventListener('pointerdown', abajo, true)
    setTimeout(() => document.removeEventListener('click', clic, true), 600) // el clic llega al soltar
  }
  vt.finished.then(fin, fin)
}

// Respaldo: copia estática de la página con el tema nuevo, encima y sin capturar eventos.
// Los tokens de color cuelgan de [data-theme], así que la copia se pinta con el aspecto nuevo sin tocar el real.
function revelarConCapa({ siguiente, x, y, radio, aplicar }) {
  const html = document.documentElement
  const capa = document.createElement('div')
  capa.className = 'capa-tema'
  capa.dataset.theme = siguiente
  capa.setAttribute('aria-hidden', 'true')
  capa.inert = true
  Object.assign(capa.style, { width: `${html.clientWidth}px`, height: `${window.innerHeight}px`, clipPath: circulo(x, y, 0) })
  const copia = document.getElementById('root').cloneNode(true)
  copia.removeAttribute('id')
  copia.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'))
  copia.querySelectorAll('[role=status], dialog').forEach((el) => el.remove())
  capa.append(copia)
  document.body.append(capa)
  capa.scrollTop = window.scrollY // misma porción de página; el sticky de la copia sigue funcionando

  const onda = capa.animate({ clipPath: [circulo(x, y, 0), circulo(x, y, radio)] }, { duration: MS, easing: EASE, fill: 'forwards' })
  const cristal = capa.animate(KEYS_CRISTAL, { duration: MS, easing: EASE })
  let hecho = false
  const fin = () => {
    if (hecho) return
    hecho = true
    onda.cancel()
    cristal.cancel()
    aplicar() // el tema real cambia en el mismo instante en que se retira la capa: sin parpadeo
    capa.remove()
    terminarCapa = null
  }
  terminarCapa = fin
  onda.finished.then(fin, () => {})
  setTimeout(fin, MS + 80) // si el navegador pausa las animaciones (pestaña en segundo plano), la capa no se queda puesta
}

// Tema claro/oscuro: se guarda en localStorage y se aplica con data-theme en <html>
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('petcare-theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#E7EEEF' : '#0F171A')
    try { localStorage.setItem('petcare-theme', theme) } catch { /* sin almacenamiento */ }
  }, [theme])
  // `origen` es el botón pulsado. Con movimiento reducido el cambio es directo: sin onda, desenfoque ni escala.
  const toggle = (origen) => {
    terminarCapa?.() // si el respaldo seguía en curso, se completa antes de calcular el tema siguiente
    const html = document.documentElement
    const siguiente = (destino ?? html.dataset.theme) === 'light' ? 'dark' : 'light' // varios toques seguidos siguen alternando
    destino = siguiente
    const aplicar = () => {
      html.dataset.theme = siguiente
      flushSync(() => setTheme(siguiente))
      if (destino === siguiente) destino = null
    }
    if (!origen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { aplicar(); return }

    const r = origen.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const radio = Math.ceil(Math.hypot(Math.max(x, html.clientWidth - x), Math.max(y, window.innerHeight - y)))

    if (typeof document.startViewTransition === 'function') {
      const vt = document.startViewTransition(aplicar)
      vt.ready.then(() => {
        html.animate({ clipPath: [circulo(x, y, 0), circulo(x, y, radio)] }, { duration: MS, easing: EASE, fill: 'forwards', pseudoElement: '::view-transition-new(root)' })
      }, () => {})
      conservarClics(vt)
      return
    }
    revelarConCapa({ siguiente, x, y, radio, aplicar })
  }
  return [theme, toggle]
}

// Hora actual en minutos desde medianoche; se actualiza cada 30 s
export function useNowMin() {
  const get = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() }
  const [m, setM] = useState(get)
  useEffect(() => { const id = setInterval(() => setM(get()), 30000); return () => clearInterval(id) }, [])
  return m
}

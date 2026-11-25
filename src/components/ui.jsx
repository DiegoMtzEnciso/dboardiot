import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

export const Panel = ({ title, aside, className = '', children }) => (
  <section className={`flex min-w-0 flex-col glass rounded-3xl p-5 sm:p-6 ${className}`}>
    <header className="mb-5 flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      {aside}
    </header>
    {children}
  </section>
)

export const Sk = ({ className = '' }) => <div className={`animate-pulse rounded-xl bg-line/10 ${className}`} />

export const primaryBtn = 'min-h-12 rounded-xl bg-accent px-5 text-[15px] font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-45'
export const ghostBtn = 'min-h-11 rounded-xl px-4 text-sm font-semibold text-fg2 ring-1 ring-hairline-strong transition-colors hover:bg-line/10 hover:text-fg disabled:opacity-45'

export function Switch({ checked, onChange, className = 'flex', children }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`min-h-11 items-center justify-between gap-3 text-sm font-medium text-fg2 hover:text-fg ${className}`}>
      {children}
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-faint'}`}>
        <span className={`absolute left-1 top-1 h-4 w-4 rounded-full transition-transform ${checked ? 'translate-x-4 bg-on-accent' : 'bg-white'}`} />
      </span>
    </button>
  )
}

export function Segmented({ options, value, onChange, label, className = '' }) {
  return (
    <div role="group" aria-label={label} className={`grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-surface2 p-1 ${className}`}>
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}
          className={`min-h-10 rounded-lg px-3 text-sm font-medium transition-colors ${value === o ? 'bg-fg text-canvas' : 'text-muted hover:text-fg'}`}>{o}</button>
      ))}
    </div>
  )
}

// Mantener presionado para ejecutar (mueve hardware real). Teclado: mantener Enter o Espacio.
// Los lectores de pantalla envían un clic sin presión: en ese caso se pide un segundo clic.
const HOLD_MS = 900
export function HoldButton({ onHold, disabled, children }) {
  const [activo, setActivo] = useState(false)
  const [aviso, setAviso] = useState(null)
  const t = useRef(null)
  const tAviso = useRef(null)
  const armado = useRef(false)
  const tecla = useRef(false)
  const decir = (m) => { clearTimeout(tAviso.current); setAviso(m); tAviso.current = setTimeout(() => { setAviso(null); armado.current = false }, 2600) }
  const ejecutar = () => { armado.current = false; setAviso(null); onHold() }
  const inicia = () => {
    if (disabled || t.current) return
    setActivo(true)
    t.current = setTimeout(() => { t.current = null; setActivo(false); navigator.vibrate?.(30); ejecutar() }, HOLD_MS)
  }
  const suelta = (avisar) => {
    setActivo(false)
    if (!t.current) return
    clearTimeout(t.current); t.current = null; setActivo(false)
    if (avisar) decir('Mantén presionado hasta llenar la barra')
  }
  useEffect(() => () => { clearTimeout(t.current); clearTimeout(tAviso.current) }, [])
  useEffect(() => { if (disabled) { clearTimeout(t.current); t.current = null } }, [disabled])
  return (
    <div>
      <button type="button" disabled={disabled} aria-describedby="ayuda-servir"
        onPointerDown={(e) => { if (e.button === 0) inicia() }} onPointerUp={() => suelta(true)} onPointerLeave={() => suelta(false)} onPointerCancel={() => suelta(false)}
        onContextMenu={(e) => e.preventDefault()} onBlur={() => { tecla.current = false; suelta(false) }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) { tecla.current = true; inicia() } } }}
        onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tecla.current = false; suelta(true) } }}
        onClick={(e) => {
          if (e.detail !== 0 || tecla.current) return
          if (armado.current) ejecutar()
          else { decir('Activa otra vez para confirmar'); armado.current = true }
        }}
        className="relative min-h-14 w-full touch-none select-none overflow-hidden rounded-2xl bg-accent px-5 font-display text-lg font-semibold text-on-accent disabled:opacity-45">
        <span aria-hidden className="absolute inset-0 origin-left bg-on-accent/25"
          style={{ transform: `scaleX(${activo && !disabled ? 1 : 0})`, transition: `transform ${activo ? HOLD_MS : 150}ms linear` }} />
        <span className="relative">{children}</span>
      </button>
      <p id="ayuda-servir" aria-live="polite" className={`mt-2 min-h-5 text-center text-[13px] ${aviso ? 'font-medium text-fg' : 'text-muted'}`}>{aviso ?? 'Mantén presionado para servir'}</p>
    </div>
  )
}

// Selector con lista propia (portal, teclado y ARIA). Dentro de un <dialog> la lista se monta en él para quedar encima.
export function Select({ id, value, onChange, options, label }) {
  const btnRef = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, up: false, raiz: null })
  const typed = useRef({ text: '', t: 0 })
  const listId = `${id}-lista`

  const abrir = () => {
    const r = btnRef.current.getBoundingClientRect()
    const alto = Math.min(options.length * 40 + 12, 288)
    const up = window.innerHeight - r.bottom < alto + 16 && r.top > alto + 16
    setPos({ top: up ? r.top - 8 : r.bottom + 8, left: r.left, width: r.width, up, raiz: btnRef.current.closest('dialog') ?? document.body })
    setActive(Math.max(0, options.indexOf(value)))
    setOpen(true)
  }
  const cerrar = (foco = true) => { setOpen(false); if (foco) btnRef.current?.focus() }
  const elegir = (o) => { onChange(o); cerrar() }

  useEffect(() => { if (open) listRef.current?.focus({ preventScroll: true }) }, [open])
  useEffect(() => {
    if (!open) return undefined
    const fuera = (e) => { if (!listRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false) }
    const cierra = () => setOpen(false)
    const alScroll = (e) => { if (!listRef.current?.contains(e.target)) setOpen(false) } // el scroll interno de la lista no la cierra
    document.addEventListener('pointerdown', fuera)
    window.addEventListener('resize', cierra)
    window.addEventListener('scroll', alScroll, true)
    return () => { document.removeEventListener('pointerdown', fuera); window.removeEventListener('resize', cierra); window.removeEventListener('scroll', alScroll, true) }
  }, [open])
  useEffect(() => { // mantiene visible la opción activa moviendo solo el scroll de la lista
    if (!open) return
    const el = document.getElementById(`${id}-op-${active}`)
    const ul = listRef.current
    if (!el || !ul) return
    if (el.offsetTop < ul.scrollTop) ul.scrollTop = el.offsetTop - 6
    else if (el.offsetTop + el.offsetHeight > ul.scrollTop + ul.clientHeight) ul.scrollTop = el.offsetTop + el.offsetHeight - ul.clientHeight + 6
  }, [open, active, id])

  const onKeyList = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(options[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); cerrar() }
    else if (e.key === 'Tab') setOpen(false)
    else if (e.key.length === 1) { // búsqueda por teclado
      const now = Date.now()
      typed.current.text = now - typed.current.t > 600 ? e.key.toLowerCase() : typed.current.text + e.key.toLowerCase()
      typed.current.t = now
      const i = options.findIndex((o) => o.toLowerCase().startsWith(typed.current.text))
      if (i >= 0) setActive(i)
    }
  }

  return (
    <div>
      <button ref={btnRef} id={id} type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
        onClick={() => (open ? cerrar(false) : abrir())}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!open) abrir() } }}
        className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-xl bg-surface2 py-2 pl-4 pr-3 text-left text-[15px] font-medium text-fg ring-1 transition duration-200 hover:bg-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${open ? 'ring-accent/60' : 'ring-hairline-strong'}`}>
        <span className="truncate">{value}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <ul ref={listRef} id={listId} role="listbox" tabIndex={-1} aria-label={label} aria-activedescendant={`${id}-op-${active}`} onKeyDown={onKeyList}
          className="glass-pop pop-in shadow-2xl fixed z-50 max-h-72 overflow-y-auto rounded-xl p-1.5 outline-none"
          style={{ left: pos.left, width: pos.width, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}>
          {options.map((o, i) => (
            <li key={o} id={`${id}-op-${i}`} role="option" aria-selected={o === value}
              onPointerEnter={() => setActive(i)} onClick={() => elegir(o)}
              className={`flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 text-[14px] transition-colors duration-150 ${o === value ? 'font-semibold text-accent' : 'text-fg2'} ${i === active ? 'bg-line/10' : ''} ${o === value ? 'bg-accent/10' : ''}`}>
              <span>{o}</span>
              {o === value && <Check size={15} className="shrink-0" />}
            </li>
          ))}
        </ul>,
        pos.raiz,
      )}
    </div>
  )
}

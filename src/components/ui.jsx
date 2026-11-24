import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

// Tarjeta del bento: superficie sutil, borde de 1px y encabezado de 13px
export const Card = ({ title, icon: Icon, aside, className = '', children }) => (
  <section className={`flex h-full w-full min-w-0 flex-col glass rounded-3xl p-5 sm:p-6 ${className}`}>
    {(title || aside) && (
      <header className="mb-4 flex min-h-6 items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-fg">
          {Icon && <Icon size={15} className="text-faint" />}{title}
        </h2>
        {aside}
      </header>
    )}
    {children}
  </section>
)

export const Sk = ({ className = '' }) => <div className={`animate-pulse rounded-lg bg-line/10 ${className}`} />

// Control segmentado compacto con indicador deslizante
export function Segmented({ options, value, onChange, label }) {
  const i = Math.max(0, options.indexOf(value))
  return (
    <div role="group" aria-label={label} className="relative grid rounded-lg bg-surface2 p-0.5 ring-1 ring-hairline" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      <span aria-hidden className="absolute inset-y-0.5 left-0.5 rounded-md bg-cyan-500 transition-transform duration-200 ease-out"
        style={{ width: `calc((100% - 0.25rem) / ${options.length})`, transform: `translateX(${i * 100}%)` }} />
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}
          className={`relative z-10 min-h-9 rounded-md px-2 text-[13px] font-medium transition-colors duration-200 ${value === o ? 'text-slate-950' : 'text-muted hover:text-fg'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}

export const fieldCls = 'w-full min-h-10 rounded-lg bg-surface2 px-3 text-[13px] text-fg outline-none ring-1 ring-hairline-strong transition-shadow duration-200 focus:ring-2 focus:ring-accent'

// Selector "Glass Pill": botón en forma de píldora translúcida + lista de cristal (portal, teclado y ARIA)
export function Select({ id, value, onChange, options, label }) {
  const btnRef = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, up: false })
  const typed = useRef({ text: '', t: 0 })
  const listId = `${id}-lista`

  const abrir = () => {
    const r = btnRef.current.getBoundingClientRect()
    const alto = Math.min(options.length * 40 + 12, 288)
    const up = window.innerHeight - r.bottom < alto + 16 && r.top > alto + 16
    setPos({ top: up ? r.top - 8 : r.bottom + 8, left: r.left, width: r.width, up })
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
        className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-full bg-line/5 py-2 pl-4 pr-3 text-left text-[13px] font-medium text-fg ring-1 backdrop-blur-md transition duration-200 hover:bg-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${open ? 'ring-accent/60' : 'ring-hairline-strong'}`}>
        <span className="truncate">{value}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <ul ref={listRef} id={listId} role="listbox" tabIndex={-1} aria-label={label} aria-activedescendant={`${id}-op-${active}`} onKeyDown={onKeyList}
          className="glass-pop pop-in fixed z-50 max-h-72 overflow-y-auto rounded-2xl p-1.5 outline-none"
          style={{ left: pos.left, width: pos.width, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}>
          {options.map((o, i) => (
            <li key={o} id={`${id}-op-${i}`} role="option" aria-selected={o === value}
              onPointerEnter={() => setActive(i)} onClick={() => elegir(o)}
              className={`flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-xl px-3 text-[13px] transition-colors duration-150 ${o === value ? 'font-semibold text-accent' : 'text-fg2'} ${i === active ? 'bg-line/10' : ''} ${o === value ? 'bg-accent/10' : ''}`}>
              <span>{o}</span>
              {o === value && <Check size={15} className="shrink-0" />}
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  )
}

export const primaryBtn = 'min-h-10 rounded-lg bg-cyan-500 px-4 text-[13px] font-semibold text-slate-950 transition duration-200 hover:bg-cyan-400 active:scale-[0.98]'
export const ghostBtn = 'min-h-10 rounded-lg px-4 text-[13px] font-semibold text-accent ring-1 ring-hairline-strong transition duration-200 hover:bg-line/5 active:scale-[0.98]'

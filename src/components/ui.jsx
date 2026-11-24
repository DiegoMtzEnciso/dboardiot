import { ChevronDown } from 'lucide-react'

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

export function Select({ id, value, onChange, options, label, className = '' }) {
  return (
    <div className="relative">
      <select id={id} aria-label={label} value={value} onChange={onChange} className={`${fieldCls} appearance-none pr-9 ${className}`}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  )
}

export const primaryBtn = 'min-h-10 rounded-lg bg-cyan-500 px-4 text-[13px] font-semibold text-slate-950 transition duration-200 hover:bg-cyan-400 active:scale-[0.98]'
export const ghostBtn = 'min-h-10 rounded-lg px-4 text-[13px] font-semibold text-accent ring-1 ring-hairline-strong transition duration-200 hover:bg-line/5 active:scale-[0.98]'

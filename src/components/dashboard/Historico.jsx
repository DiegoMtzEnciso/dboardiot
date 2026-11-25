import { useState } from 'react'
import { Panel, Segmented } from '../ui'

const W = 600, H = 200
const SERIES = { Plato: ['peso', 'g', '--food'], Tolva: ['tolva', '%', '--food'], Tanque: ['agua', '%', '--water'] }

export default function Historico({ s }) {
  const { historial } = s
  const [serie, setSerie] = useState('Plato')
  const [cursor, setCursor] = useState(null)
  const [campo, unidad, color] = SERIES[serie]
  const n = historial.length
  const vals = historial.map((h) => h[campo])
  const max = unidad === '%' ? 100 : Math.max(20, Math.ceil(Math.max(0, ...vals) / 10) * 10)
  const x = (i) => (n < 2 ? W / 2 : (i / (n - 1)) * W)
  const y = (v) => H - (Math.max(0, Math.min(v, max)) / max) * H
  const i = cursor != null && cursor < n ? cursor : n - 1
  const linea = vals.map((v, k) => `${k ? 'L' : 'M'}${x(k)} ${y(v)}`).join(' ')
  const apuntar = (e) => { const r = e.currentTarget.getBoundingClientRect(); setCursor(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))))) }
  const teclas = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setCursor(Math.max(0, i - 1)) }
    if (e.key === 'ArrowRight') { e.preventDefault(); setCursor(Math.min(n - 1, i + 1)) }
  }

  return (
    <Panel title="Lecturas" aside={<Segmented label="Lectura" options={Object.keys(SERIES)} value={serie} onChange={setSerie} />}>
      {n === 0 ? (
        <div className="flex min-h-[15rem] flex-1 items-center justify-center rounded-2xl bg-surface2 p-6 text-center text-sm text-muted">La gráfica empieza con la primera lectura de la estación.</div>
      ) : (
        <>
          <p className="tabular-nums"><span className="font-display text-3xl font-bold">{Math.round(vals[i])} {unidad}</span> <span className="ml-1 text-sm text-muted">a las {historial[i].hora}</span></p>
          <div className="mt-4 grid flex-1 grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2">
            <div className="flex flex-col justify-between text-right text-xs tabular-nums text-muted"><span>{max}</span><span>{max / 2}</span><span>0</span></div>
            <div tabIndex={0} role="slider" aria-label={`Lecturas de ${serie.toLowerCase()}`} aria-valuemin={1} aria-valuemax={n} aria-valuenow={i + 1} aria-valuetext={`${Math.round(vals[i])} ${unidad} a las ${historial[i].hora}`}
              onPointerMove={apuntar} onPointerDown={apuntar} onPointerLeave={() => setCursor(null)} onKeyDown={teclas} onBlur={() => setCursor(null)}
              className="relative min-h-[11rem] cursor-crosshair touch-pan-y">
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
                {[0, 0.5, 1].map((f) => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgb(var(--line) / .14)" vectorEffect="non-scaling-stroke" />)}
                {n > 1 && <path d={`${linea} L${W} ${H} L0 ${H} Z`} fill={`rgb(var(${color}) / .16)`} />}
                <path d={linea} fill="none" stroke={`rgb(var(${color}))`} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <line x1={x(i)} x2={x(i)} y1="0" y2={H} stroke="rgb(var(--line) / .3)" vectorEffect="non-scaling-stroke" opacity={cursor == null ? 0 : 1} />
              </svg>
              <span className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-surface" style={{ left: `${(x(i) / W) * 100}%`, top: `${(y(vals[i]) / H) * 100}%`, background: `rgb(var(${color}))` }} />
            </div>
            <span />
            <div className="mt-2 flex justify-between text-xs tabular-nums text-muted"><span>{historial[0].hora}</span>{n > 1 && <span>{historial[n - 1].hora}</span>}</div>
          </div>
        </>
      )}
    </Panel>
  )
}

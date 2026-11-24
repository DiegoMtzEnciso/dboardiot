import { Cpu, LineChart } from 'lucide-react'
import { has, fmt } from '../../lib/utils'
import { Card } from '../ui'

const W = 600
const H = 200
const PAD = 10
// Curva de ejemplo que se muestra mientras no hay lecturas
const EJEMPLO = [14, 22, 36, 30, 24, 42, 37, 27, 20, 33, 44, 38]

function trazar(vals, max) {
  const n = vals.length
  const xs = vals.map((_, i) => (n === 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (n - 1)))
  const ys = vals.map((v) => H - PAD - (Math.min(v, max) / max) * (H - 2 * PAD))
  let linea = `M ${xs[0]} ${ys[0]}`
  for (let i = 0; i < n - 1; i++) {
    const cx = (xs[i] + xs[i + 1]) / 2
    linea += ` C ${cx} ${ys[i]}, ${cx} ${ys[i + 1]}, ${xs[i + 1]} ${ys[i + 1]}`
  }
  const area = `${linea} L ${xs[n - 1]} ${H} L ${xs[0]} ${H} Z`
  return { linea, area, x: xs[n - 1], y: ys[n - 1] }
}

// Histórico del peso del plato (área suave) + insignia discreta del modelo Edge MLP (ESP32)
export default function Analitica({ s }) {
  const { telemetria: t, historial } = s
  const edge = has(t.dosis_ia) || has(t.intervalo_ia)
  const real = historial.length > 0
  const vals = real ? historial.map((h) => h.peso) : EJEMPLO
  const max = Math.max(10, ...vals) * 1.15
  const { linea, area, x, y } = trazar(vals, max)

  const aside = (
    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums ${edge ? 'bg-edge/10 text-edge' : 'text-muted ring-1 ring-hairline-strong'}`}>
      <Cpu size={12} />
      {edge ? `Edge MLP · ${fmt(t.dosis_ia)} g · cada ${has(t.intervalo_ia) ? t.intervalo_ia : '—'} h` : 'Edge MLP · sin datos'}
    </span>
  )

  return (
    <Card title="Histórico del plato" icon={LineChart} aside={aside}>
      <div className="relative flex min-h-[15rem] flex-1 flex-col rounded-xl bg-surface2 p-4">
        <div className="mb-2 flex items-center justify-between text-[11px] tabular-nums text-muted">
          <span>{real ? `Peso del plato · últimas ${historial.length} lecturas` : 'Ejemplo · esperando lecturas MQTT'}</span>
          <span>máx {Math.round(max / 1.15)} g</span>
        </div>
        <div className="relative min-h-[9rem] flex-1">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="Gráfica del peso del plato">
            <defs>
              <linearGradient id="grad-hist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'rgb(var(--data))', stopOpacity: real ? 0.4 : 0.18 }} />
                <stop offset="100%" style={{ stopColor: 'rgb(var(--data))', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} style={{ stroke: 'rgb(var(--line) / 0.08)' }} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}
            <path d={area} fill="url(#grad-hist)" />
            <path d={linea} fill="none" style={{ stroke: 'rgb(var(--data))' }} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={real ? undefined : '6 6'} opacity={real ? 1 : 0.55} vectorEffect="non-scaling-stroke" />
          </svg>
          {real && (
            <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-data ring-4 ring-[rgb(var(--data)/0.25)] transition-all duration-500"
              style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }} />
          )}
        </div>
        <div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted">
          <span>{real ? historial[0].hora : ''}</span>
          <span>{real ? historial[historial.length - 1].hora : ''}</span>
        </div>
      </div>
    </Card>
  )
}

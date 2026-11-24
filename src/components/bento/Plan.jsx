import { Check, UtensilsCrossed } from 'lucide-react'
import { MAX_TOMA_G } from '../../hooks/usePetStation'
import { useNowMin } from '../../lib/hooks'
import { Card, Sk } from '../ui'

const toMin = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b }
const posOf = (m) => 6 + Math.min(1, Math.max(0, (m - 360) / 960)) * 88 // 06:00 → 22:00

// KPI del plan nutricional + línea de tiempo con estado de cada toma
export default function Plan({ s }) {
  const { nutricionIA: n, isInitialLoading: L } = s
  const now = useNowMin()
  const horarios = Array.isArray(n.horarios) ? n.horarios : []
  const mins = horarios.map(toMin)
  const nextIdx = mins.findIndex((m) => m > now)
  const tope = n.requerimiento && n.requerimiento > n.total_diario + 2

  let proxima
  if (nextIdx === -1) proxima = `Tomas de hoy completadas · mañana ${horarios[0] ?? ''}`
  else {
    const d = mins[nextIdx] - now
    proxima = `Próxima toma ${horarios[nextIdx]} · en ${d >= 60 ? `${Math.floor(d / 60)} h ` : ''}${d % 60} min`
  }

  return (
    <Card title="Plan nutricional" icon={UtensilsCrossed}>
      {L ? <Sk className="h-40" /> : (
        <div className="flex flex-1 flex-col justify-between gap-7">
          <div>
            <p className="text-4xl font-bold leading-none tracking-tight tabular-nums text-fg">
              {n.total_diario}<span className="ml-1.5 text-sm font-medium tracking-normal text-muted">g/día</span>
            </p>
            <p className="mt-2 text-[13px] tabular-nums text-muted">
              <span className="font-semibold text-fg">{n.tomas ?? horarios.length}</span> tomas de <span className="font-semibold text-fg">{n.gramos_por_toma} g</span>
            </p>
            {tope && <p className="mt-1 text-xs tabular-nums text-warn">Tope del dispensador: {MAX_TOMA_G} g por toma</p>}
          </div>

          <div>
            <div className="relative h-[4.25rem]" aria-label="Horarios de las tomas">
              <div className="absolute inset-x-0 top-[9px] h-px bg-hairline-strong" />
              <div className="absolute left-0 top-[8px] h-0.5 rounded-full bg-accent transition-all duration-500" style={{ width: `${posOf(now)}%` }} />
              {horarios.map((h, i) => {
                const done = mins[i] <= now
                const next = i === nextIdx
                return (
                  <div key={h} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${posOf(mins[i])}%` }}>
                    <span className={`mx-auto flex h-[18px] w-[18px] items-center justify-center rounded-full transition-colors duration-300 ${done ? 'bg-accent text-surface' : next ? 'bg-surface ring-2 ring-accent' : 'bg-surface ring-1 ring-hairline-strong'}`}>
                      {done && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className={`mt-2 block text-xs tabular-nums ${next ? 'font-bold text-fg' : done ? 'text-muted' : 'font-medium text-fg2'}`}>{h}</span>
                    <span className="block text-[11px] tabular-nums text-muted">{n.gramos_por_toma} g</span>
                  </div>
                )
              })}
            </div>
            <p className="mt-4 text-xs text-muted">{proxima}</p>
          </div>
        </div>
      )}
    </Card>
  )
}

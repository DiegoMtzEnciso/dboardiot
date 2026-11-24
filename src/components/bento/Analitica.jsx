import { Cpu, LineChart } from 'lucide-react'
import { has, fmt } from '../../lib/utils'
import { Card } from '../ui'

// Histórico del peso del plato + insignia discreta del modelo Edge MLP (ESP32)
export default function Analitica({ s }) {
  const { telemetria: t, historial } = s
  const edge = has(t.dosis_ia) || has(t.intervalo_ia)
  const max = Math.max(1, ...historial.map((h) => h.peso))

  const aside = (
    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums ${edge ? 'bg-edge/10 text-edge' : 'text-muted ring-1 ring-hairline-strong'}`}>
      <Cpu size={12} />
      {edge ? `Edge MLP · ${fmt(t.dosis_ia)} g · cada ${has(t.intervalo_ia) ? t.intervalo_ia : '—'} h` : 'Edge MLP · sin datos'}
    </span>
  )

  return (
    <Card title="Histórico del plato" icon={LineChart} aside={aside}>
      <div className="relative flex min-h-[15rem] flex-1 items-end gap-1.5 rounded-xl bg-surface2 p-4 pt-8">
        {historial.length === 0 ? (
          <p className="m-auto self-center text-[13px] text-muted">Las lecturas de peso aparecerán aquí.</p>
        ) : (
          <>
            <span className="absolute left-4 top-3 text-[11px] tabular-nums text-muted">máx {max} g · últimas {historial.length}</span>
            {historial.map((h, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${h.hora} · ${h.peso} g`}>
                <div className={`w-full rounded-t transition-all duration-500 ${i === historial.length - 1 ? 'bg-data' : 'bg-data/45'}`} style={{ height: `${(h.peso / max) * 100}%`, minHeight: 2 }} />
                <span className="hidden text-[10px] tabular-nums text-muted sm:block">{h.hora.slice(3)}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </Card>
  )
}

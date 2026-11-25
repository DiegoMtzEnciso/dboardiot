import { History } from 'lucide-react'
import { Card } from '../ui'

const texto = (e) => (typeof e === 'string' ? e : (e.mensaje ?? e.evento ?? e.texto ?? JSON.stringify(e)))

// Últimos tres eventos de la bitácora, con acceso al historial completo
export default function ActividadReciente({ s, go }) {
  const items = s.activityFeed.filter((e, i, arr) => i === 0 || texto(e) !== texto(arr[i - 1])).slice(0, 3)
  return (
    <Card title="Actividad reciente" icon={History}>
      <ul className="flex-1 space-y-1 text-[13px]">
        {items.length === 0 && <li className="py-2 text-muted">Sin eventos por ahora.</li>}
        {items.map((e, i) => (
          <li key={i} className="flex gap-3 rounded-md px-1 py-2 leading-snug text-fg2">
            {typeof e !== 'string' && <span className="w-10 shrink-0 pt-px text-xs tabular-nums text-muted">{e.hora ?? e.fecha}</span>}
            <span className={i === 0 ? 'text-fg' : ''}>{texto(e)}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => go('datos')} className="mt-3 self-start rounded-lg px-1 py-1.5 text-xs font-medium text-accent transition-opacity duration-200 hover:opacity-80">Ver bitácora completa</button>
    </Card>
  )
}

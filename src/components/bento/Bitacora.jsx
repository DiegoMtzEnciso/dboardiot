import { Activity } from 'lucide-react'
import { Card } from '../ui'

const texto = (e) => (typeof e === 'string' ? e : (e.mensaje ?? e.evento ?? e.texto ?? JSON.stringify(e)))

// Bitácora compacta: altura fija con scroll interno; colapsa mensajes idénticos consecutivos
export default function Bitacora({ s }) {
  const items = s.activityFeed.filter((e, i, arr) => i === 0 || texto(e) !== texto(arr[i - 1]))
  return (
    <Card title="Bitácora" icon={Activity}>
      <ul className="max-h-[15rem] min-h-[15rem] flex-1 space-y-0.5 overflow-y-auto pr-1 text-[13px]">
        {items.length === 0 && <li className="py-2 text-muted">Sin eventos por ahora.</li>}
        {items.map((e, i) => (
          <li key={i} className="flex gap-3 rounded-md px-1 py-2 leading-snug text-fg2 transition-colors duration-200 hover:bg-line/5">
            {typeof e !== 'string' && <span className="w-10 shrink-0 pt-px text-xs tabular-nums text-muted">{e.hora ?? e.fecha}</span>}
            <span className={i === 0 ? 'text-fg' : ''}>{texto(e)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

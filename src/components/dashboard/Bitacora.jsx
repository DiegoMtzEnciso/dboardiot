import { useState } from 'react'
import { Panel } from '../ui'

const texto = (e) => (typeof e === 'string' ? e : (e.mensaje ?? e.evento ?? e.texto ?? JSON.stringify(e)))
const CORTO = 5

export default function Bitacora({ s }) {
  const [todo, setTodo] = useState(false)
  const items = s.activityFeed.filter((e, i, arr) => i === 0 || texto(e) !== texto(arr[i - 1]))
  return (
    <Panel title="Actividad">
      {items.length === 0 && <p className="text-sm text-muted">Aquí aparecerán las raciones servidas y los cambios de perfil.</p>}
      <ol className="divide-y divide-hairline">
        {(todo ? items : items.slice(0, CORTO)).map((e, i) => (
          <li key={i} className="flex gap-4 py-3 text-sm leading-snug first:pt-0">
            {typeof e !== 'string' && <time className="w-11 shrink-0 tabular-nums text-muted">{e.hora ?? e.fecha}</time>}
            <span className="min-w-0 break-words">{texto(e)}</span>
          </li>
        ))}
      </ol>
      {items.length > CORTO && <button type="button" onClick={() => setTodo(!todo)} className="mt-2 min-h-11 self-start text-sm font-semibold text-accent">{todo ? 'Mostrar menos' : `Ver los ${items.length} eventos`}</button>}
    </Panel>
  )
}

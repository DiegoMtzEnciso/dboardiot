import { useNowMin } from './hooks'
import { horaAMin, servidoHoy } from './utils'

export const duracion = (min) => [min >= 60 && `${Math.floor(min / 60)} h`, (min % 60 || min < 60) && `${min % 60} min`].filter(Boolean).join(' ')

// Todo lo derivado del día en un solo lugar: tomas, la siguiente, lo servido y el avance
export function useDia({ nutricionIA: n, perfil, extraHoy }) {
  const ahora = useNowMin()
  const tomas = (Array.isArray(n.horarios) ? n.horarios : []).map((hora) => {
    const min = horaAMin(hora)
    return { hora, min, pasada: min <= ahora }
  })
  const siguiente = tomas.findIndex((t) => !t.pasada)
  const hoy = siguiente !== -1
  const prox = tomas[hoy ? siguiente : 0]
  const falta = prox ? (hoy ? prox.min - ahora : 1440 - ahora + prox.min) : null
  const meta = Number(n.total_diario) || 0
  const servido = servidoHoy(n, perfil.auto, ahora, extraHoy)
  return { ahora, tomas, siguiente, hoy, prox, falta, meta, servido, pct: meta ? Math.round((servido / meta) * 100) : 0 }
}

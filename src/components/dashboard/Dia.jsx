import { useState } from 'react'
import { MAX_TOMA_G } from '../../hooks/usePetStation'
import { duracion } from '../../lib/dia'
import { Panel, Sk, Switch } from '../ui'

const INI = 6 * 60, FIN = 22 * 60
const pos = (m) => Math.min(100, Math.max(0, ((m - INI) / (FIN - INI)) * 100))
const HORAS = [6, 10, 14, 18, 22]

// El día completo: cada toma es una columna que se puede tocar para ver su detalle
export default function Dia({ s, dia }) {
  const { nutricionIA: n, perfil, setAuto, isInitialLoading } = s
  const [sel, setSel] = useState(null)
  const { tomas, siguiente, hoy, prox, falta, ahora } = dia
  const i = sel != null && sel < tomas.length ? sel : null
  const t = i != null ? tomas[i] : null
  const g = n.gramos_por_toma
  const limitado = n.requerimiento > n.total_diario + 2

  let titulo = 'Sin tomas programadas', detalle = ''
  if (t) {
    titulo = `Toma de las ${t.hora}`
    detalle = t.pasada
      ? `${g} g, hace ${duracion(ahora - t.min)}. ${perfil.auto ? 'Cumplida según el horario.' : 'El servido automático está apagado, no se puede dar por servida.'}`
      : `${g} g, en ${duracion(t.min - ahora)}. ${perfil.auto ? 'Saldrá sola.' : 'Tendrás que servirla a mano.'}`
  } else if (prox) {
    titulo = hoy ? `Próxima toma en ${duracion(falta)}` : `Próxima toma mañana a las ${prox.hora}`
    detalle = hoy ? `${g} g a las ${prox.hora}.` : `${g} g, en ${duracion(falta)}. Las de hoy ya pasaron.`
  }

  return (
    <Panel title="Su día" aside={<Switch checked={perfil.auto} onChange={setAuto}>Servido automático</Switch>}>
      {isInitialLoading ? <Sk className="h-56" /> : (
        <>
          <div aria-live="polite">
            <p className="text-balance font-display text-3xl font-bold leading-none tracking-tight tabular-nums sm:text-5xl">{titulo}</p>
            <p className="mt-3 text-[15px] tabular-nums text-muted">{detalle}</p>
          </div>

          <div className="relative mx-5 mt-8 h-32">
            <div className="absolute inset-x-[-1.25rem] bottom-8 h-px bg-hairline-strong" />
            {HORAS.map((h) => (
              <span key={h} className="absolute bottom-0 -translate-x-1/2 text-xs tabular-nums text-muted" style={{ left: `${pos(h * 60)}%` }}>{h}:00</span>
            ))}
            {tomas.map((x, k) => {
              const activa = i === k
              return (
                <button key={x.hora} type="button" aria-pressed={activa} onClick={() => setSel(activa ? null : k)}
                  aria-label={`Toma de las ${x.hora}, ${g} gramos, ${x.pasada ? 'ya pasó' : 'pendiente'}`}
                  className="absolute bottom-8 flex h-24 w-11 -translate-x-1/2 flex-col items-center justify-end" style={{ left: `${pos(x.min)}%` }}>
                  <span className={`mb-1.5 text-xs tabular-nums ${k === siguiente || activa ? 'font-bold text-fg' : 'text-muted'}`}>{x.hora}</span>
                  <span className={`w-5 rounded-t-md transition-colors sm:w-7 ${x.pasada ? 'bg-food' : 'bg-food/25 shadow-[inset_0_0_0_2px_rgb(var(--food))]'} ${activa ? 'outline outline-2 outline-offset-2 outline-fg' : ''}`}
                    style={{ height: `${Math.max(14, (g / MAX_TOMA_G) * 64)}px` }} />
                </button>
              )
            })}
            {ahora >= INI && ahora <= FIN && (
              <div className="pointer-events-none absolute bottom-[1.625rem] h-3 w-3 -translate-x-1/2 rounded-full bg-accent ring-4 ring-surface" style={{ left: `${pos(ahora)}%` }}><span className="sr-only">Ahora</span></div>
            )}
          </div>

          <p className="mt-5 text-sm tabular-nums text-muted">
            Plan de {n.total_diario} g al día en {tomas.length} tomas de {g} g.
            {limitado && <span className="text-warn"> Necesita {n.requerimiento} g, pero el dispensador entrega como máximo {MAX_TOMA_G} g por toma.</span>}
          </p>
        </>
      )}
    </Panel>
  )
}

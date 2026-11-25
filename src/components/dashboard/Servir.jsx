import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { MAX_TOMA_G, MIN_MANUAL_G } from '../../hooks/usePetStation'
import { has, fmt } from '../../lib/utils'
import { HoldButton, Panel, Segmented, ghostBtn } from '../ui'

export default function Servir({ s, dia }) {
  const { nutricionIA: n, telemetria: t, mqttOnline, demo } = s
  const [modo, setModo] = useState('Plan')
  const [gramos, setGramos] = useState(30)
  const [hora, setHora] = useState('08:00')
  const g = modo === 'Plan' ? Number(n.gramos_por_toma) || 0 : gramos
  const total = dia.servido + g
  const exceso = total - dia.meta
  const conectado = mqttOnline || demo

  return (
    <Panel title="Servir ahora" aside={<Segmented label="Cantidad" options={['Plan', 'Manual']} value={modo} onChange={setModo} />}>
      <div className="flex flex-1 flex-col">
        <p className="font-display text-6xl font-bold leading-none tracking-tight tabular-nums text-food">{g}<span className="ml-1.5 text-2xl font-semibold">g</span></p>
        {modo === 'Plan' ? (
          <p className="mt-3 min-h-11 text-sm text-muted">La ración del plan. La estación hace el ajuste final{has(t.dosis_ia) ? `; su modelo propone ${fmt(t.dosis_ia)} g` : ''}.</p>
        ) : (
          <>
            <label htmlFor="gramos" className="sr-only">Gramos a servir</label>
            <input id="gramos" type="range" min={MIN_MANUAL_G} max={MAX_TOMA_G} step="1" value={gramos} onChange={(e) => setGramos(Number(e.target.value))}
              className="gramos mt-3" style={{ '--p': `${((gramos - MIN_MANUAL_G) / (MAX_TOMA_G - MIN_MANUAL_G)) * 100}%` }} aria-valuetext={`${gramos} gramos`} />
          </>
        )}
        <p className={`mb-4 mt-2 min-h-10 text-sm tabular-nums ${exceso > 0 ? 'font-medium text-warn' : 'text-muted'}`}>
          {exceso > 0 ? `Con esta ración llegaría a ${total} g, ${exceso} g más que su meta de hoy.` : `Quedaría en ${total} de ${dia.meta} g.`}
        </p>
        <div className="mt-auto">
          <HoldButton disabled={!conectado} onHold={() => (modo === 'Plan' ? s.dispensarIA() : s.dispensarManual(gramos))}>{conectado ? `Servir ${g} g` : 'Esperando conexión'}</HoldButton>
        </div>
        <details className="group mt-3 border-t border-hairline pt-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-fg2 [&::-webkit-details-marker]:hidden">
            Báscula y hora de prueba <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid gap-3 pb-1 pt-2">
            <button type="button" disabled={!conectado} onClick={s.tararBascula} className={ghostBtn}>Poner báscula en cero</button>
            <div className="flex flex-wrap gap-2">
              <label htmlFor="hora" className="sr-only">Hora de prueba</label>
              <input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl bg-surface2 px-3 tabular-nums" />
              <button type="button" disabled={!conectado || !hora} onClick={() => s.fijarHoraPrueba(hora)} className={ghostBtn}>Fijar hora</button>
            </div>
          </div>
        </details>
      </div>
    </Panel>
  )
}

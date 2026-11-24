import { useState } from 'react'
import { CheckCircle2, ChevronDown, Clock, Scale, Zap } from 'lucide-react'
import { Card, fieldCls, primaryBtn, ghostBtn } from '../ui'

// Centro de dispensación: acción principal + ración manual; la hora de prueba queda en un desplegable discreto
export default function Dispensacion({ s }) {
  const { perfil, setAuto, dispensarIA, dispensarManual, tararBascula, fijarHoraPrueba } = s
  const [hora, setHora] = useState('08:00')
  const [gramos, setGramos] = useState(30)
  const [flash, setFlash] = useState(null)
  const [simular, setSimular] = useState(false)
  const ping = (k) => { setFlash(k); setTimeout(() => setFlash((f) => (f === k ? null : f)), 1800) }

  const sec = 'flex min-h-10 items-center justify-center gap-2 rounded-lg text-[13px] font-medium text-muted ring-1 ring-hairline transition duration-200 hover:bg-line/5 hover:text-fg active:scale-[0.99]'

  return (
    <Card title="Dispensación" icon={Zap}>
      <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2">
        <button type="button" onClick={() => { dispensarIA(); ping('ia') }} className={`${primaryBtn} min-h-11 text-sm sm:col-span-2`}>
          {flash === 'ia' ? <span className="inline-flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Ración solicitada</span> : 'Dispensar ración IA'}
        </button>

        <button type="button" role="switch" aria-checked={perfil.auto} onClick={() => setAuto(!perfil.auto)}
          className="flex w-full items-center justify-between rounded-lg bg-surface2 px-3 py-2.5 text-[13px] text-fg transition-colors duration-200 hover:bg-line/5 sm:col-span-2">
          Dispensado Automático IA
          <span className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${perfil.auto ? 'bg-cyan-500' : 'bg-faint'}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${perfil.auto ? 'left-[18px]' : 'left-0.5'}`} />
          </span>
        </button>

        <div className="sm:col-span-2">
          <label htmlFor="gramos" className="mb-1.5 block text-xs text-muted">Ración manual · 5–85 g</label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input id="gramos" type="number" inputMode="numeric" min={5} max={85} value={gramos} onChange={(e) => setGramos(e.target.value)} className={`${fieldCls} pr-7 tabular-nums`} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">g</span>
            </div>
            <button type="button" onClick={() => { dispensarManual(gramos); ping('man') }} className={`${primaryBtn} min-w-24`}>{flash === 'man' ? '✓ Enviado' : 'Servir'}</button>
          </div>
        </div>

        {/* Acciones secundarias, discretas */}
        <button type="button" onClick={() => { tararBascula(); ping('tare') }} className={sec}>
          <Scale size={14} /> {flash === 'tare' ? '✓ En 0 g' : 'Tarar báscula'}
        </button>
        <button type="button" aria-expanded={simular} aria-controls="panel-simular-hora" onClick={() => setSimular((v) => !v)} className={`${sec} ${simular ? 'bg-line/5 text-fg' : ''}`}>
          <Clock size={14} /> Simular hora
          <ChevronDown size={14} className={`transition-transform duration-200 ${simular ? 'rotate-180' : ''}`} />
        </button>

        {/* Hora de prueba (para probar el dispensado automático en la demo) */}
        <div id="panel-simular-hora" inert={!simular}
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out sm:col-span-2 ${simular ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="rounded-lg bg-surface2 p-3">
              <label htmlFor="hora" className="mb-1.5 block text-xs text-muted">Hora de prueba del dispensado automático</label>
              <div className="flex gap-2">
                <input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={`${fieldCls} min-w-0 flex-1 tabular-nums`} />
                <button type="button" onClick={() => { fijarHoraPrueba(hora); ping('hora') }} className={`${ghostBtn} min-w-24`}>{flash === 'hora' ? '✓ Fijada' : 'Fijar'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

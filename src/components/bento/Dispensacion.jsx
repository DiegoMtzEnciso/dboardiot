import { useState } from 'react'
import { CheckCircle2, Scale, Zap } from 'lucide-react'
import { Card, fieldCls, primaryBtn, ghostBtn } from '../ui'

// Centro de dispensación: acción principal + controles manuales en cuadrícula de 2 columnas
export default function Dispensacion({ s }) {
  const { perfil, setAuto, dispensarIA, dispensarManual, tararBascula, fijarHoraPrueba } = s
  const [hora, setHora] = useState('08:00')
  const [gramos, setGramos] = useState(30)
  const [flash, setFlash] = useState(null)
  const ping = (k) => { setFlash(k); setTimeout(() => setFlash((f) => (f === k ? null : f)), 1800) }

  return (
    <Card title="Dispensación" icon={Zap}>
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
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

        <div>
          <label htmlFor="gramos" className="mb-1.5 block text-xs text-muted">Ración manual · 5–85 g</label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input id="gramos" type="number" inputMode="numeric" min={5} max={85} value={gramos} onChange={(e) => setGramos(e.target.value)} className={`${fieldCls} pr-7 tabular-nums`} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">g</span>
            </div>
            <button type="button" onClick={() => { dispensarManual(gramos); ping('man') }} className={primaryBtn}>{flash === 'man' ? '✓' : 'Servir'}</button>
          </div>
        </div>

        <div>
          <label htmlFor="hora" className="mb-1.5 block text-xs text-muted">Hora de prueba</label>
          <div className="flex gap-2">
            <input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={`${fieldCls} min-w-0 flex-1 tabular-nums`} />
            <button type="button" onClick={() => { fijarHoraPrueba(hora); ping('hora') }} className={ghostBtn}>{flash === 'hora' ? '✓' : 'Fijar'}</button>
          </div>
        </div>

        <button type="button" onClick={() => { tararBascula(); ping('tare') }}
          className="flex min-h-9 items-center justify-center gap-2 rounded-lg text-[13px] font-medium text-muted ring-1 ring-hairline transition duration-200 hover:bg-line/5 hover:text-fg active:scale-[0.99] sm:col-span-2">
          <Scale size={14} /> {flash === 'tare' ? '✓ Báscula en 0 g' : 'Tarar báscula (0 g)'}
        </button>
      </div>
    </Card>
  )
}

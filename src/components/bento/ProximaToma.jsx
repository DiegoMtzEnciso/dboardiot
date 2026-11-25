import { useState } from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import { useNowMin } from '../../lib/hooks'
import { horaAMin } from '../../lib/utils'
import { Card, primaryBtn } from '../ui'

const duracion = (min) => `${min >= 60 ? `${Math.floor(min / 60)} h ` : ''}${min % 60} min`

// Próxima toma con cuenta regresiva y acción rápida
export default function ProximaToma({ s }) {
  const { nutricionIA: n, perfil, dispensarIA } = s
  const ahora = useNowMin()
  const [ok, setOk] = useState(false)
  const horarios = Array.isArray(n.horarios) ? n.horarios : []
  const mins = horarios.map(horaAMin)
  const idx = mins.findIndex((m) => m > ahora)
  const hoy = idx !== -1
  const hora = hoy ? horarios[idx] : horarios[0]
  const falta = hoy ? mins[idx] - ahora : 24 * 60 - ahora + (mins[0] ?? 0)

  return (
    <Card title="Próxima toma" icon={Clock}>
      <div className="flex flex-1 flex-col justify-between gap-6">
        <div>
          <p className="text-4xl font-bold leading-none tracking-tight tabular-nums text-fg">{hora ?? '—'}</p>
          <p className="mt-2 text-[13px] tabular-nums text-muted">
            {hoy ? 'en ' : 'mañana · en '}<span className="font-semibold text-fg">{duracion(falta)}</span> · <span className="font-semibold text-fg">{n.gramos_por_toma} g</span>
          </p>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${perfil.auto ? 'bg-ok' : 'bg-faint'}`} />
            Dispensado automático {perfil.auto ? 'activo' : 'desactivado'}
          </p>
        </div>
        <button type="button" onClick={() => { dispensarIA(); setOk(true); setTimeout(() => setOk(false), 1800) }} className={`${primaryBtn} min-h-11 w-full text-sm`}>
          {ok ? <span className="inline-flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Ración solicitada</span> : 'Dispensar ración IA'}
        </button>
      </div>
    </Card>
  )
}

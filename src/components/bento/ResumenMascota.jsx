import { PawPrint } from 'lucide-react'
import { useNowMin } from '../../lib/hooks'
import { servidoHoy } from '../../lib/utils'
import { Card } from '../ui'
import FotoPerfil from '../FotoPerfil'

// Resumen ejecutivo de la mascota activa: sin formularios, solo lo esencial
export default function ResumenMascota({ s, go }) {
  const { perfil, nutricionIA: n, extraHoy } = s
  const ahora = useNowMin()
  const meta = Number(n.total_diario) || 0
  const servido = servidoHoy(n, perfil.auto, ahora, extraHoy)
  const pct = meta > 0 ? Math.min(100, Math.round((servido / meta) * 100)) : 0

  return (
    <Card title="Mascota activa" icon={PawPrint}
      aside={<button type="button" onClick={() => go('cuidado')} className="text-xs font-medium text-accent transition-opacity duration-200 hover:opacity-80">Editar perfil</button>}>
      <div className="grid flex-1 gap-5 sm:grid-cols-[minmax(0,12rem)_1fr]">
        <FotoPerfil key={`${perfil.raza}|${perfil.etapa}`} perfil={perfil} />
        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div>
            <p className="font-display text-xl font-semibold leading-snug tracking-tight text-fg">{perfil.raza}</p>
            <p className="mt-1.5 text-[13px] tabular-nums text-muted">
              {perfil.etapa} · Actividad {perfil.actividad.toLowerCase()} · <span className="font-semibold text-fg">{n.peso_kg ?? '—'}</span> kg{n.peso_propio ? ' (registrado)' : ' (estimado)'}
            </p>
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Servido hoy</p>
                <p className="mt-1 text-[28px] font-bold leading-none tracking-tight tabular-nums text-fg">
                  {servido}<span className="ml-1 text-sm font-medium tracking-normal text-muted">/ {meta} g</span>
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-ok">{pct}%</p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line/10" role="progressbar" aria-label="Gramos servidos hoy" aria-valuemin={0} aria-valuemax={meta} aria-valuenow={servido}>
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">{perfil.auto ? 'Incluye las tomas automáticas ya cumplidas' : 'Dispensado automático desactivado'}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

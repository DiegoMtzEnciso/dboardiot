import { Pencil } from 'lucide-react'
import { ghostBtn } from '../ui'
import FotoPerfil from '../FotoPerfil'

const nombre = (raza) => raza.replace(/\s*\(.*\)$/, '')

export default function Mascota({ s, dia, onEditar }) {
  const { perfil, nutricionIA: n } = s
  const excede = dia.servido > dia.meta
  return (
    <section aria-label="Mascota" className="glass rounded-3xl p-4 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 sm:grid-cols-[12rem_minmax(0,1fr)] lg:flex lg:h-full lg:flex-col lg:gap-4 lg:overflow-y-auto">
      <FotoPerfil key={`${perfil.raza}|${perfil.etapa}`} perfil={perfil} />
      <div className="flex min-w-0 flex-col justify-center gap-3">
        <div>
          <h2 className="text-balance font-display text-2xl font-bold leading-[1.05] tracking-tight lg:text-4xl">{nombre(perfil.raza)}</h2>
          <p className="mt-2 text-sm tabular-nums text-muted lg:hidden">
            {perfil.etapa}, {n.peso_kg} kg {n.peso_propio ? 'registrados' : 'estimados'}. Actividad {perfil.actividad.toLowerCase()}.
          </p>
        </div>
        <dl className="hidden divide-y divide-hairline text-sm lg:block">
          {[['Etapa', perfil.etapa], ['Peso', `${n.peso_kg} kg ${n.peso_propio ? 'registrado' : 'estimado'}`], ['Actividad', perfil.actividad]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2.5"><dt className="text-muted">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>
          ))}
        </dl>
        <button type="button" onClick={onEditar} className={`${ghostBtn} inline-flex items-center justify-center gap-2 self-start lg:self-stretch`}><Pencil size={15} /> Editar perfil</button>
      </div>
      <div className="col-span-full lg:mt-auto">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-muted">Comida de hoy <span className="text-faint">(estimada)</span></p>
          <p className={`text-sm font-semibold tabular-nums ${excede ? 'text-warn' : 'text-fg'}`}>{dia.servido} de {dia.meta} g</p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line/10" role="progressbar" aria-label="Comida servida hoy" aria-valuemin={0} aria-valuemax={Math.max(dia.meta, dia.servido)} aria-valuenow={dia.servido}>
          <div className={`h-full rounded-full transition-[width] duration-500 ${excede ? 'bg-warn' : 'bg-food'}`} style={{ width: `${Math.min(100, dia.pct)}%` }} />
        </div>
      </div>
    </section>
  )
}

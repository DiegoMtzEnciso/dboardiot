import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ACTIVIDADES, ETAPAS, LISTA_RAZAS, calcularNutricion, pesoEstimado } from '../../hooks/usePetStation'
import { Segmented, Select, ghostBtn, primaryBtn } from '../ui'

const Campo = ({ titulo, children }) => <div><p className="mb-2 text-sm font-medium text-fg2">{titulo}</p>{children}</div>

// Borrador: nada se envía a la estación hasta pulsar Guardar
export default function EditarPerfil({ s, onCerrar }) {
  const { perfil, pesoRegistrado, guardarPerfil } = s
  const ref = useRef(null)
  const pesoDe = (r, e) => String(pesoRegistrado(r, e) ?? '')
  const inicial = { raza: perfil.raza, etapa: perfil.etapa, actividad: perfil.actividad, kg: pesoDe(perfil.raza, perfil.etapa) }
  const [b, setB] = useState(inicial)
  const [base] = useState(inicial)
  useEffect(() => { const d = ref.current; if (!d.open) d.showModal() }, [])

  const cambia = (c) => setB((v) => {
    const x = { ...v, ...c }
    if ('raza' in c || 'etapa' in c) x.kg = pesoDe(x.raza, x.etapa)
    return x
  })
  const num = Math.round(Number(b.kg.replace(',', '.')) * 10) / 10
  const vacio = b.kg.trim() === ''
  const valido = vacio || (Number.isFinite(num) && num >= 0.5 && num <= 90)
  const kg = vacio || !valido ? null : num
  const plan = calcularNutricion(b.raza, b.etapa, b.actividad, kg ?? undefined)
  const cambios = JSON.stringify(b) !== JSON.stringify(base)
  const guardar = (e) => { e.preventDefault(); if (!valido || !cambios) return; guardarPerfil({ ...b, kg }); ref.current.close() }

  return (
    <dialog ref={ref} className="cajon" aria-labelledby="titulo-perfil" onClose={onCerrar}>
      <form onSubmit={guardar} className="flex flex-col gap-6 p-5 sm:p-7">
        <header className="flex items-center justify-between">
          <h2 id="titulo-perfil" className="font-display text-2xl font-bold tracking-tight">Perfil de la mascota</h2>
          <button type="button" onClick={() => ref.current.close()} aria-label="Cerrar sin guardar" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-line/10"><X size={20} /></button>
        </header>
        <Campo titulo="Raza"><Select id="raza" label="Raza" value={b.raza} options={LISTA_RAZAS} onChange={(raza) => cambia({ raza })} /></Campo>
        <Campo titulo="Etapa"><Segmented label="Etapa" options={ETAPAS} value={b.etapa} onChange={(etapa) => cambia({ etapa })} /></Campo>
        <Campo titulo="Actividad"><Segmented label="Actividad" options={ACTIVIDADES} value={b.actividad} onChange={(actividad) => cambia({ actividad })} /></Campo>
        <div>
          <label htmlFor="kg" className="mb-2 block text-sm font-medium text-fg2">Peso real en kg</label>
          <input id="kg" inputMode="decimal" value={b.kg} onChange={(e) => cambia({ kg: e.target.value })} placeholder={`${pesoEstimado(b.raza, b.etapa)} (estimado)`} aria-invalid={!valido} aria-describedby="kg-ayuda"
            className={`min-h-12 w-full rounded-xl bg-surface2 px-4 text-[15px] tabular-nums ring-1 placeholder:text-muted ${valido ? 'ring-hairline-strong' : 'ring-warn'}`} />
          <p id="kg-ayuda" className={`mt-2 text-[13px] ${valido ? 'text-muted' : 'text-warn'}`}>{valido ? 'Déjalo vacío para usar el peso estimado.' : 'Escribe un peso entre 0.5 y 90 kg.'}</p>
        </div>
        <div className="mt-auto rounded-2xl bg-surface2 p-4" aria-live="polite">
          <p className="text-sm text-muted">Plan con este perfil</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums">{plan.total_diario} g al día</p>
          <p className="mt-1 text-sm tabular-nums text-muted">{plan.tomas} tomas de {plan.gramos_por_toma} g{cambios && plan.total_diario !== s.nutricionIA.total_diario ? `. Antes ${s.nutricionIA.total_diario} g.` : ''}</p>
        </div>
        <footer className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => ref.current.close()} className={ghostBtn}>Cancelar</button>
          <button type="submit" disabled={!cambios || !valido} className={primaryBtn}>Guardar</button>
        </footer>
      </form>
    </dialog>
  )
}

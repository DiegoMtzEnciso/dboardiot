import { useState } from 'react'
import { Check, Pencil, PawPrint, RotateCcw } from 'lucide-react'
import { LISTA_RAZAS, ETAPAS, ACTIVIDADES } from '../../hooks/usePetStation'
import { Card, Segmented, Select } from '../ui'
import FotoPerfil from '../FotoPerfil'

// Hero de la mascota: foto a la izquierda; raza, etapa y actividad a la derecha
export default function Hero({ s }) {
  const { perfil, nutricionIA: n, cambiarPerfil, setPesoPropio } = s
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState('')
  const abrir = () => { setValor(String(n.peso_kg ?? '')); setEditando(true) }
  const guardar = () => {
    const kg = Math.round(Number(String(valor).replace(',', '.')) * 10) / 10
    if (Number.isFinite(kg) && kg >= 0.5 && kg <= 90) setPesoPropio(kg)
    setEditando(false)
  }
  return (
    <Card title="Mascota" icon={PawPrint}>
      <div className="grid flex-1 gap-5 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <FotoPerfil key={`${perfil.raza}|${perfil.etapa}`} perfil={perfil} />
        <div className="flex min-w-0 flex-col justify-between gap-4">
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs text-muted">Raza</p>
              <Select id="raza" label="Raza" value={perfil.raza} options={LISTA_RAZAS} onChange={(raza) => cambiarPerfil({ raza })} />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-muted">Etapa</p>
              <Segmented label="Etapa" options={ETAPAS} value={perfil.etapa} onChange={(etapa) => cambiarPerfil({ etapa })} />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-muted">Actividad</p>
              <Segmented label="Actividad" options={ACTIVIDADES} value={perfil.actividad} onChange={(actividad) => cambiarPerfil({ actividad })} />
            </div>
          </div>
          <div className="flex min-h-9 items-center gap-2 text-xs text-muted">
            {editando ? (
              <>
                <label htmlFor="peso-kg" className="sr-only">Peso en kg</label>
                <input id="peso-kg" type="number" inputMode="decimal" step="0.5" min="0.5" max="90" autoFocus value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') setEditando(false) }}
                  className="min-h-9 w-20 rounded-lg bg-surface2 px-2 text-[13px] font-semibold tabular-nums text-fg outline-none ring-1 ring-hairline-strong focus:ring-2 focus:ring-accent" />
                <span>kg</span>
                <button type="button" onClick={guardar} aria-label="Guardar peso" className="flex h-9 w-9 items-center justify-center rounded-lg text-accent ring-1 ring-hairline-strong transition duration-200 hover:bg-line/5"><Check size={15} /></button>
              </>
            ) : (
              <>
                <span>Peso {n.peso_propio ? 'registrado' : `estimado · ${perfil.etapa.toLowerCase()}`}</span>
                <span className="text-[15px] font-bold tabular-nums text-fg">{n.peso_kg ?? '—'}<span className="ml-0.5 text-xs font-medium text-muted">kg</span></span>
                <button type="button" onClick={abrir} aria-label="Registrar peso real" title="Registrar peso real" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition duration-200 hover:bg-line/5 hover:text-fg"><Pencil size={13} /></button>
                {n.peso_propio && (
                  <button type="button" onClick={() => setPesoPropio(null)} aria-label="Volver al peso estimado" title="Volver al peso estimado" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition duration-200 hover:bg-line/5 hover:text-fg"><RotateCcw size={13} /></button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

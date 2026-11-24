import { PawPrint } from 'lucide-react'
import { LISTA_RAZAS, ETAPAS, ACTIVIDADES } from '../../hooks/usePetStation'
import { Card, Segmented, Select } from '../ui'
import FotoPerfil from '../FotoPerfil'

// Hero de la mascota: foto a la izquierda; raza, etapa y actividad a la derecha
export default function Hero({ s }) {
  const { perfil, nutricionIA: n, cambiarPerfil } = s
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
          <p className="text-xs text-muted">Peso estimado <span className="text-[15px] font-bold tabular-nums text-fg">{n.peso_kg ?? '—'}</span> kg</p>
        </div>
      </div>
    </Card>
  )
}

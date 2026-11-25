import { clamp, fmt, has } from '../../lib/utils'
import { Panel, Switch } from '../ui'

// Depósito dibujado a escala: la altura del relleno es el porcentaje
function Deposito({ nombre, valor, color, critico, nota }) {
  const ok = has(valor)
  return (
    <div className="flex min-w-0 flex-col">
      <div className="relative h-36 overflow-hidden rounded-2xl bg-surface2" role="meter" aria-label={nombre} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ok ? clamp(valor) : undefined} aria-valuetext={ok ? `${fmt(valor)}%` : 'Sin lectura'}>
        {ok && <div className={`absolute inset-x-0 bottom-0 border-t-2 transition-[height] duration-700 ${critico ? 'border-warn bg-warn/30' : color}`} style={{ height: `${clamp(valor)}%` }} />}
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums sm:text-3xl">{ok ? <>{fmt(valor)}<span className="text-base">%</span></> : '—'}</p>
      <p className="mt-1 text-sm font-medium">{nombre}</p>
      <p className={`min-h-5 text-[13px] ${critico ? 'font-medium text-warn' : 'text-muted'}`}>{!ok ? 'Sin lectura' : critico ? 'Rellenar' : nota}</p>
    </div>
  )
}

const COMIDA = 'border-food bg-food/30', AGUA = 'border-water bg-water/30'

export default function Niveles({ s }) {
  const { telemetria: t } = s
  return (
    <Panel title="Depósitos">
      <div className="grid grid-cols-3 gap-3">
        <Deposito nombre="Tolva" valor={t.tolva_comida} color={COMIDA} critico={has(t.tolva_comida) && Number(t.tolva_comida) <= 15} nota="Comida" />
        <Deposito nombre="Tanque" valor={t.tanque_agua} color={AGUA} critico={has(t.tanque_agua) && Number(t.tanque_agua) <= 15} nota="Agua" />
        <Deposito nombre="Bebedero" valor={t.nivel_agua_plato} color={AGUA} nota={t.bomba_activa ? 'Bomba llenando' : 'Agua'} />
      </div>
      <dl className="mt-5 grid grid-cols-2 xl:mt-auto gap-3 border-t border-hairline pt-4 text-sm">
        <div><dt className="text-muted">En el plato</dt><dd className="mt-1 font-display text-2xl font-bold tabular-nums">{has(t.peso) ? `${fmt(t.peso)} g` : '—'}</dd></div>
        <div><dt className="text-muted">Modelo en la estación</dt><dd className="mt-1 text-[15px] font-semibold tabular-nums">{has(t.dosis_ia) ? `${fmt(t.dosis_ia)} g` : '—'}{has(t.intervalo_ia) ? ` cada ${t.intervalo_ia} h` : ''}</dd></div>
      </dl>
      <Switch checked={s.demo} onChange={s.setDemo} className="mt-4 flex sm:hidden">Simular datos</Switch>
    </Panel>
  )
}

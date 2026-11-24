import { Droplets, FlaskConical, Gauge, Package, Scale, Waves } from 'lucide-react'
import { has, fmt, clamp } from '../../lib/utils'
import { Card, Sk } from '../ui'

// KPI con icono sutil y barra de nivel mínima
function Kpi({ icon: Icon, label, value, unit = '%', alert, sub }) {
  const ok = has(value)
  const crit = ok && alert
  return (
    <div className="rounded-xl bg-surface2 p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Icon size={14} className={crit ? 'text-warn' : 'text-faint'} />{label}
      </div>
      <p className={`mt-3 flex h-8 items-end text-[28px] font-bold leading-none tracking-tight tabular-nums ${crit ? 'text-warn' : 'text-fg'}`}>
        {ok ? <>{fmt(value)}<span className="ml-1 text-xs font-medium tracking-normal text-muted">{unit}</span></> : <span className="text-[13px] font-normal tracking-normal text-faint">Sin lectura</span>}
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-line/10" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ok ? Number(value) : undefined}>
        <div className={`h-full rounded-full transition-all duration-700 ${crit ? 'bg-warn' : 'bg-data'}`} style={{ width: `${ok ? clamp(Number(value)) : 0}%` }} />
      </div>
      <p className={`mt-2 h-4 text-xs ${crit ? 'font-medium text-warn' : 'text-muted'}`}>{crit ? 'Nivel crítico' : sub}</p>
    </div>
  )
}

export default function Sensores({ s }) {
  const { telemetria: t, isInitialLoading: L, demo, setDemo } = s
  const vivo = [t.peso, t.tolva_comida, t.nivel_agua_plato, t.tanque_agua].some(has)

  const aside = (
    <div className="flex items-center gap-3">
      <span className={`flex items-center gap-1.5 text-xs font-medium ${vivo ? 'text-ok' : 'text-muted'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${vivo ? 'bg-ok' : 'animate-pulse bg-warn'}`} />
        {vivo ? 'En vivo' : 'Sin lectura MQTT'}
      </span>
      <button type="button" role="switch" aria-checked={demo} onClick={() => setDemo(!demo)} title="Datos simulados"
        className={`flex min-h-7 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium transition-colors duration-200 ${demo ? 'bg-edge/10 text-edge' : 'text-muted ring-1 ring-hairline-strong hover:bg-line/5'}`}>
        <FlaskConical size={12} /> Simular
        <span className={`relative h-3 w-5 rounded-full transition-colors duration-200 ${demo ? 'bg-edge' : 'bg-faint'}`}>
          <span className={`absolute top-0.5 h-2 w-2 rounded-full bg-white transition-all duration-200 ${demo ? 'left-[10px]' : 'left-0.5'}`} />
        </span>
      </button>
    </div>
  )

  return (
    <Card title="Telemetría en vivo" icon={Gauge} aside={aside}>
      {L ? (
        <div className="grid flex-1 grid-cols-2 gap-4"><Sk className="h-36" /><Sk className="h-36" /><Sk className="h-36" /><Sk className="h-36" /></div>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-4">
          <Kpi icon={Scale} label="Peso plato" value={t.peso} unit="g" />
          <Kpi icon={Package} label="Tolva comida" value={t.tolva_comida} alert={Number(t.tolva_comida) <= 15} />
          <Kpi icon={Waves} label="Boya plato" value={t.nivel_agua_plato} sub={has(t.nivel_agua_plato) ? (t.bomba_activa ? 'Bomba llenando' : 'Nivel óptimo') : ''} />
          <Kpi icon={Droplets} label="Tanque reserva" value={t.tanque_agua} />
        </div>
      )}
    </Card>
  )
}

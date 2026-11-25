import { Cpu, Droplets, Package, Scale, Wifi, WifiOff, Activity } from 'lucide-react'
import { has, fmt, clamp } from '../../lib/utils'
import { Card } from '../ui'

function Kpi({ icon: Icon, label, value, unit = '%', alert }) {
  const ok = has(value)
  const crit = ok && alert
  return (
    <div className="rounded-xl bg-surface2 p-3.5">
      <div className="flex items-center gap-1.5 text-xs text-muted"><Icon size={13} className={crit ? 'text-warn' : 'text-faint'} />{label}</div>
      <p className={`mt-2.5 flex h-7 items-end text-2xl font-bold leading-none tracking-tight tabular-nums ${crit ? 'text-warn' : 'text-fg'}`}>
        {ok ? <>{fmt(value)}<span className="ml-0.5 text-xs font-medium tracking-normal text-muted">{unit}</span></> : <span className="text-xs font-normal tracking-normal text-faint">Sin lectura</span>}
      </p>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-line/10">
        <div className={`h-full rounded-full transition-all duration-700 ${crit ? 'bg-warn' : 'bg-data'}`} style={{ width: `${ok ? clamp(Number(value)) : 0}%` }} />
      </div>
    </div>
  )
}

// Estado de la estación de un vistazo: tolva, agua, plato y enlace Edge IA / MQTT
export default function EstadoEstacion({ s, go }) {
  const { telemetria: t, mqttOnline } = s
  const edge = has(t.dosis_ia) || has(t.intervalo_ia)
  return (
    <Card title="Estado de la estación" icon={Activity}
      aside={<button type="button" onClick={() => go('datos')} className="text-xs font-medium text-accent transition-opacity duration-200 hover:opacity-80">Ver datos</button>}>
      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={Package} label="Tolva" value={t.tolva_comida} alert={Number(t.tolva_comida) <= 15} />
        <Kpi icon={Droplets} label="Agua" value={t.tanque_agua} />
        <Kpi icon={Scale} label="Plato" value={t.peso} unit="g" />
        <div className="rounded-xl bg-surface2 p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-muted"><Cpu size={13} className="text-faint" />Edge · MQTT</div>
          <p className={`mt-2.5 flex items-center gap-1.5 text-sm font-semibold ${mqttOnline ? 'text-ok' : 'text-warn'}`}>
            {mqttOnline ? <Wifi size={15} /> : <WifiOff size={15} />}{mqttOnline ? 'Conectado' : 'Reconectando'}
          </p>
          <p className={`mt-2.5 text-xs tabular-nums ${edge ? 'text-edge' : 'text-muted'}`}>
            {edge ? `MLP · ${fmt(t.dosis_ia)} g · cada ${has(t.intervalo_ia) ? t.intervalo_ia : '—'} h` : 'MLP sin datos'}
          </p>
        </div>
      </div>
    </Card>
  )
}

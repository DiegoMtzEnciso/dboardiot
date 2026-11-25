import { TriangleAlert } from 'lucide-react'
import { has, fmt } from '../../lib/utils'

// Solo aparece cuando hay algo que atender; cada aviso dice qué hacer
export default function Avisos({ s }) {
  const { telemetria: t, mqttOnline, demo, perfil, isInitialLoading } = s
  if (isInitialLoading) return null
  const avisos = []
  if (!mqttOnline && !demo) avisos.push({ id: 'mqtt', txt: 'Sin conexión con la estación. Las órdenes no saldrán hasta que vuelva.' })
  if (has(t.tolva_comida) && Number(t.tolva_comida) <= 15) avisos.push({ id: 'tolva', txt: `Queda ${fmt(t.tolva_comida)}% de comida en la tolva. Rellénala.` })
  if (has(t.tanque_agua) && Number(t.tanque_agua) <= 15) avisos.push({ id: 'agua', txt: `Queda ${fmt(t.tanque_agua)}% de agua en el tanque. Rellénalo.` })
  if (!perfil.auto) avisos.push({ id: 'auto', txt: 'El servido automático está apagado. Las tomas del día no saldrán solas.', accion: ['Encender', () => s.setAuto(true)] })
  if (!avisos.length) return null
  return (
    <ul className="grid gap-2" aria-label="Avisos">
      {avisos.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-x-3 rounded-2xl bg-warn/15 backdrop-blur-xl px-4 py-3 text-sm">
          <TriangleAlert size={17} className="shrink-0 text-warn" />
          <span className="min-w-0 flex-1">{a.txt}</span>
          {a.accion && <button type="button" onClick={a.accion[1]} className="min-h-9 px-2 font-semibold underline underline-offset-4">{a.accion[0]}</button>}
        </li>
      ))}
    </ul>
  )
}

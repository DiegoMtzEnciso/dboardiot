export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Number(v) || 0))
// Lectura válida: null/undefined = aún sin datos del sensor
export const has = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))
export const fmt = (v) => (has(v) ? Math.round(Number(v)) : '—')

export const horaAMin = (h) => { const [a, b] = String(h).split(':').map(Number); return a * 60 + b }

// Gramos servidos hoy = tomas programadas ya cumplidas (si el dispensado automático está activo) + raciones pedidas desde la app
export function servidoHoy(plan, auto, ahoraMin, extra) {
  const horarios = Array.isArray(plan.horarios) ? plan.horarios : []
  const programado = auto ? horarios.filter((h) => horaAMin(h) <= ahoraMin).length * (Number(plan.gramos_por_toma) || 0) : 0
  return programado + (extra || 0)
}

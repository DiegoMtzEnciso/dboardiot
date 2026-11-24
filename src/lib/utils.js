export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Number(v) || 0))
// Lectura válida: null/undefined = aún sin datos del sensor
export const has = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))
export const fmt = (v) => (has(v) ? Math.round(Number(v)) : '—')

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mqtt from 'mqtt'

// Configuración por variables de entorno de Vite (se fijan al compilar). Ver .env.example
const env = import.meta.env
const BASE = (env.VITE_NODERED_URL ?? 'http://10.6.29.51:1880').replace(/\/$/, '') // '' = sin API REST
const BROKER = env.VITE_MQTT_URL ?? 'wss://test.mosquitto.org:8081'
const PREFIX = env.VITE_MQTT_PREFIX ?? 'smartcare/petstation'
const MQTT_AUTH = env.VITE_MQTT_USER ? { username: env.VITE_MQTT_USER, password: env.VITE_MQTT_PASS } : {}
// Una página https no puede llamar a un http:// (contenido mixto) ni a una IP de la red local desde fuera
const REST_OK = Boolean(BASE) && !(typeof location !== 'undefined' && location.protocol === 'https:' && BASE.startsWith('http:'))
const T = {
  alerta: `${PREFIX}/alerta`,
  perfil: `${PREFIX}/perfil`,
  racion: `${PREFIX}/set_racion`,
  tare: `${PREFIX}/tare`,
}

export const RAZAS = {
  'Mestizo / Criollo (Talla Mediana 15kg)': { kg: 15, slug: null },
  'Chihuahueño': { kg: 2.5, slug: 'chihuahua' },
  'Xoloitzcuintle': { kg: 12, slug: null },
  'Pug': { kg: 8, slug: 'pug' },
  'French Poodle': { kg: 7, slug: 'poodle/standard' },
  'Schnauzer Miniatura': { kg: 6, slug: 'schnauzer/miniature' },
  'Bulldog Francés': { kg: 12, slug: 'bulldog/french' },
  'Bulldog Inglés': { kg: 24, slug: 'bulldog/english' },
  'Golden Retriever': { kg: 31, slug: 'retriever/golden' },
  'Labrador Retriever': { kg: 30, slug: 'labrador' },
  'Pastor Alemán': { kg: 34, slug: 'germanshepherd' },
  'Pastor Belga Malinois': { kg: 28, slug: 'malinois' },
  'Husky Siberiano': { kg: 23, slug: 'husky' },
  'Pitbull': { kg: 20, slug: 'pitbull' },
  'Beagle': { kg: 11, slug: 'beagle' },
  'Yorkshire Terrier': { kg: 3, slug: 'terrier/yorkshire' },
  'Dachshund (Salchicha)': { kg: 8, slug: 'dachshund' },
  'Shih Tzu': { kg: 6, slug: 'shihtzu' },
  'Rottweiler': { kg: 45, slug: 'rottweiler' },
  'Boxer': { kg: 30, slug: 'boxer' },
  'Cocker Spaniel': { kg: 13, slug: 'spaniel/cocker' },
}
// Fotos propias (public/perros/). 'pos' = object-position para encuadrar la cara sin cortar orejas ni adornos.
export const FOTOS_LOCALES = {
  'French Poodle': { src: '/perros/poodle.webp', pos: '50% 72%' },
  'Labrador Retriever': { src: '/perros/labrador.webp', pos: '50% 20%' },
  'Mestizo / Criollo (Talla Mediana 15kg)': { src: '/perros/mestiza.webp', pos: '50% 12%' },
  // Varias fotos: se alternan en el perfil con los puntos o tocando la imagen
  'Pastor Belga Malinois': {
    fotos: [
      { src: '/perros/pastor-belga-1.jpg', pos: '50% 34%' },
      { src: '/perros/pastor-belga-2.jpg', pos: '50% 57%' },
    ],
  },
  // Foto por etapa: 'default' sirve de respaldo (p. ej. Senior o etapa sin foto propia)
  'Schnauzer Miniatura': {
    Cachorro: { src: '/perros/schnauzer-cachorro.jpg', pos: '50% 30%' },
    Adulto: { src: '/perros/schnauzer-adulto.jpg', pos: '56% 0%' },
    default: { src: '/perros/schnauzer-adulto.jpg', pos: '56% 0%' },
  },
}
// Devuelve { src, pos } de la foto propia para raza + etapa, o null si no hay.
export const fotoLocal = (raza, etapa) => {
  const f = FOTOS_LOCALES[raza]
  if (!f) return null
  if (f.fotos) return f.fotos[0]
  return f.src ? f : (f[etapa] ?? f.default ?? null)
}
// Lista de todas las fotos propias para raza + etapa (vacía si no hay).
export const fotosDe = (raza, etapa) => FOTOS_LOCALES[raza]?.fotos ?? [fotoLocal(raza, etapa)].filter(Boolean)
export const LISTA_RAZAS = Object.keys(RAZAS)
export const ETAPAS = ['Cachorro', 'Adulto', 'Senior']
export const ACTIVIDADES = ['Baja', 'Media', 'Alta']

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// ───────── Peso estimado por raza y etapa ─────────
// `kg` en RAZAS es el peso adulto típico de la raza. Para las otras etapas se aplica un factor según el tamaño:
// cachorro ≈ 3-4 meses (menos peso relativo cuanto más pequeña es la raza) y senior (razas grandes tienden a adelgazar).
const FACTOR_CACHORRO = (kg) => (kg <= 5 ? 0.3 : kg <= 10 ? 0.35 : kg <= 20 ? 0.4 : 0.42)
const FACTOR_SENIOR = (kg) => (kg <= 12 ? 1 : 0.95)
const aMedioKg = (v) => (v < 10 ? Math.round(v * 10) / 10 : Math.round(v * 2) / 2) // 0.1 kg si es pequeño, 0.5 kg si es grande

export function pesoEstimado(raza, etapa) {
  const adulto = RAZAS[raza]?.kg ?? 15
  if (etapa === 'Cachorro') return aMedioKg(adulto * FACTOR_CACHORRO(adulto))
  if (etapa === 'Senior') return aMedioKg(adulto * FACTOR_SENIOR(adulto))
  return adulto
}

// Pesos que registra el usuario para su perro (tienen prioridad sobre la estimación). Se guardan en el navegador.
const LS_PESOS = 'petcare-pesos'
export const claveKg = (raza, etapa) => `${raza}|${etapa}`
const leerPesos = () => { try { return JSON.parse(localStorage.getItem(LS_PESOS)) ?? {} } catch { return {} } }

export const MAX_TOMA_G = 85 // límite del dispensador por toma
export const MIN_TOMA_G = 20
const MAX_TOMAS = 6

const horariosPara = (n) => {
  if (n === 1) return ['12:00']
  const ini = 7 * 60 + 30, fin = 20 * 60 + 30
  return Array.from({ length: n }, (_, i) => {
    const m = Math.round(ini + ((fin - ini) * i) / (n - 1))
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  })
}

// Cálculo nutricional local (RER/MER → gramos a ~3.6 kcal/g).
// El requerimiento diario NO se recorta: si una toma excedería el límite del dispensador, se agregan tomas.
export function calcularNutricion(raza, etapa, actividad, kgPropio) {
  const kg = kgPropio ?? pesoEstimado(raza, etapa)
  const rer = 70 * Math.pow(kg, 0.75)
  const fE = { Cachorro: 2.0, Adulto: 1.6, Senior: 1.2 }[etapa] ?? 1.6
  const fA = { Baja: 0.85, Media: 1, Alta: 1.2 }[actividad] ?? 1
  const diario = Math.round((rer * fE * fA) / 3.6)
  const base = etapa === 'Cachorro' ? 3 : 2
  let tomas = clamp(Math.max(base, Math.ceil(diario / MAX_TOMA_G)), 1, MAX_TOMAS)
  while (tomas > 1 && diario / tomas < MIN_TOMA_G) tomas--
  const porToma = Math.round(clamp(diario / tomas, MIN_TOMA_G, MAX_TOMA_G))
  const extra = tomas > base ? ` Se usan ${tomas} tomas porque el dispensador entrega máx. ${MAX_TOMA_G} g por toma.` : ''
  const tope = diario / tomas > MAX_TOMA_G ? ` Aun así, el tope de ${MAX_TOMAS} tomas limita la ración a ${porToma * tomas} g.` : ''
  return {
    peso_kg: kg,
    peso_propio: kgPropio != null,
    gramos_por_toma: porToma,
    total_diario: porToma * tomas,
    tomas,
    requerimiento: diario,
    horarios: horariosPara(tomas),
    explicacion: `${kg} kg · ${etapa} · actividad ${actividad.toLowerCase()}: necesita ≈ ${diario} g/día, en ${tomas} tomas de ${porToma} g.${extra}${tope}`,
  }
}

const discretizar = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return 0
  return n <= 25 ? 25 : n <= 50 ? 50 : n <= 75 ? 75 : 100
}
const hhmm = () => new Date().toTimeString().slice(0, 5)

const TEL0 = {
  peso: null, dosis_ia: null, intervalo_ia: null, tolva_comida: null, tanque_agua: null, nivel_agua_plato: null, bomba_activa: false,
}
const PERFIL0 = { raza: 'Mestizo / Criollo (Talla Mediana 15kg)', etapa: 'Adulto', actividad: 'Media', auto: true, foto_url: fotoLocal('Mestizo / Criollo (Talla Mediana 15kg)', 'Adulto').src }

class HttpError extends Error { constructor(status) { super(`HTTP ${status}`); this.status = status } }
class BackendError extends Error {}
class SinCambioError extends Error {}

async function fetchJson(url, timeoutMs, init) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  if (!r.ok) throw new HttpError(r.status)
  const txt = await r.text()
  try { return txt ? JSON.parse(txt) : {} } catch { return {} }
}

// Traduce el fallo a un motivo exacto (red, timeout, endpoint/clave, backend)
function diagnosticar(err, etapa, seg, nr) {
  const host = BASE.replace('http://', '')
  if (err instanceof SinCambioError) {
    return { tipo: 'sin_cambio', corto: 'La IA no devolvió un plan nuevo; se usa el cálculo local.', detalle: `Node-RED respondió pero no actualizó nutricion_ia en 20 s (¿Gemini lento o flujo sin recalcular?).` }
  }
  if (err instanceof BackendError) {
    return { tipo: 'backend', corto: 'El agente IA devolvió un error.', detalle: `Mensaje del backend: ${err.message}` }
  }
  if (err instanceof HttpError) {
    if (err.status === 404) return { tipo: 'endpoint', corto: 'Endpoint de la IA no encontrado.', detalle: `HTTP 404 al ${etapa}: revisa que el flujo exponga /api/petstation/comando y /estado.` }
    if (err.status === 401 || err.status === 403) return { tipo: 'clave', corto: 'Acceso rechazado por el backend.', detalle: `HTTP ${err.status} al ${etapa}: clave o permisos inválidos.` }
    return { tipo: 'backend', corto: `Error del backend (HTTP ${err.status}).`, detalle: `HTTP ${err.status} al ${etapa}: falló el flujo de Node-RED o la llamada a Gemini.` }
  }
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
    if (nr?.ok === false) return { tipo: 'red', corto: 'Node-RED no es alcanzable desde este dispositivo.', detalle: `Sin respuesta de ${host} (${seg} s, ${etapa}). La consulta periódica también falla: revisa IP, red/VPN y que Node-RED esté encendido.` }
    return { tipo: 'timeout', corto: 'La IA tardó más de lo esperado.', detalle: `Sin respuesta en ${seg} s mientras se hacía: ${etapa}.` }
  }
  if (err instanceof TypeError) {
    return { tipo: 'red', corto: 'No se pudo conectar con Node-RED.', detalle: `Fallo de red/CORS hacia ${host} (${etapa}). ¿Misma red? ¿CORS habilitado en Node-RED?` }
  }
  return { tipo: 'desconocido', corto: 'Error inesperado al consultar la IA.', detalle: String(err?.message ?? err) }
}

export function usePetStation() {
  const [mqttOnline, setMqttOnline] = useState(false)
  const [isInitialLoading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(PERFIL0)
  const remoteNutri = useRef(null)
  const nodeRed = useRef({ ok: null })
  const agenteReq = useRef(0)
  const [nutricionIA, setNutricion] = useState(() => calcularNutricion(PERFIL0.raza, PERFIL0.etapa, PERFIL0.actividad, leerPesos()[claveKg(PERFIL0.raza, PERFIL0.etapa)]))
  const [telemetria, setTelemetria] = useState(TEL0)
  const [activityFeed, setFeed] = useState([])
  const [historial, setHistorial] = useState([])
  const client = useRef(null)
  const perfilRef = useRef(PERFIL0)
  const pesosRef = useRef(leerPesos())
  // Peso vigente: el registrado por el usuario o, si no hay, el estimado por raza y etapa
  const kgDe = useCallback((p) => pesosRef.current[claveKg(p.raza, p.etapa)] ?? pesoEstimado(p.raza, p.etapa), [])
  useEffect(() => { perfilRef.current = perfil }, [perfil])
  const fotoReq = useRef(0)
  const telRef = useRef(TEL0)
  const demoRef = useRef(false)

  // Modo vista previa: datos simulados que NO tocan el estado real ni envían comandos al dispositivo
  const [demo, setDemoState] = useState(false)
  const [telDemo, setTelDemo] = useState(TEL0)
  const [histDemo, setHistDemo] = useState([])
  const [feedDemo, setFeedDemo] = useState([])

  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const notificar = useCallback((msg) => {
    clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), msg: demoRef.current ? `${msg} · simulado` : msg })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Si no hay conexión MQTT la orden no sale: se recuerda para avisarlo en el siguiente log()
  const pubFallo = useRef(false)
  const log = useCallback((mensaje) => {
    if (pubFallo.current && !demoRef.current) { mensaje = `${mensaje} · sin conexión MQTT, no se envió`; pubFallo.current = false }
    notificar(mensaje)
    const ev = { hora: hhmm(), mensaje }
    if (demoRef.current) setFeedDemo((f) => [{ ...ev, mensaje: `(Demo) ${mensaje}` }, ...f].slice(0, 40))
    else setFeed((f) => [ev, ...f].slice(0, 40))
  }, [notificar])

  const pub = useCallback((topic, msg) => {
    if (demoRef.current) return
    try {
      if (client.current?.connected) client.current.publish(topic, msg, { qos: 1 })
      else pubFallo.current = true
    } catch { pubFallo.current = true }
  }, [])

  const post = useCallback(async (payload) => {
    if (demoRef.current || !REST_OK) return
    try {
      await fetch(`${BASE}/api/petstation/comando`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch { /* silencioso */ }
  }, [])

  const cargarFoto = useCallback(async (raza, etapa) => {
    const slug = RAZAS[raza]?.slug
    const id = ++fotoReq.current
    const local = fotoLocal(raza, etapa)
    if (local) { setPerfil((p) => ({ ...p, foto_url: local.src })); return }
    try {
      const url = slug ? `https://dog.ceo/api/breed/${slug}/images/random` : 'https://dog.ceo/api/breeds/image/random'
      const r = await fetch(url)
      const d = await r.json()
      if (id === fotoReq.current && d.message) setPerfil((p) => ({ ...p, foto_url: d.message }))
    } catch { /* silencioso */ }
  }, [])

  // Lecturas históricas
  const pushHistorial = (t) =>
    setHistorial((h) => [...h, { hora: hhmm(), peso: Number(t.peso) || 0, tolva: Number(t.tolva_comida) || 0, agua: Number(t.tanque_agua) || 0 }].slice(-15))

  useEffect(() => {
    const kill = setTimeout(() => setLoading(false), 600)
    const c = mqtt.connect(BROKER, { reconnectPeriod: 3000, ...MQTT_AUTH })
    client.current = c
    c.on('connect', () => { setMqttOnline(true); c.subscribe(T.alerta, { qos: 1 }) })
    c.on('close', () => setMqttOnline(false))
    c.on('offline', () => setMqttOnline(false))
    c.on('error', () => setMqttOnline(false))
    c.on('message', (_t, buf) => {
      try {
        const m = JSON.parse(buf.toString())
        setLoading(false)
        const n = { ...telRef.current }
        if (m.peso !== undefined) n.peso = Number(m.peso)
        if (m.dosis_ia !== undefined) { const d = Number(m.dosis_ia); n.dosis_ia = d > 20 ? clamp(d, 20, 85) : d }
        if (m.intervalo_ia !== undefined) n.intervalo_ia = m.intervalo_ia
        if (m.tolva_comida !== undefined) n.tolva_comida = Number(m.tolva_comida)
        if (m.tanque_agua !== undefined) n.tanque_agua = Number(m.tanque_agua)
        if (m.nivel_agua_plato !== undefined) n.nivel_agua_plato = discretizar(m.nivel_agua_plato)
        if (m.bomba_activa !== undefined) n.bomba_activa = !!m.bomba_activa
        telRef.current = n
        setTelemetria(n)
        pushHistorial(n)
      } catch { /* no JSON */ }
    })

    let vivo = true
    const sync = async () => {
      if (!REST_OK) return
      try {
        const r = await fetch(`${BASE}/api/petstation/estado`, { signal: AbortSignal.timeout(3500) })
        if (!r.ok) { nodeRed.current = { ok: false, status: r.status }; return }
        const d = await r.json()
        nodeRed.current = { ok: true }
        if (!vivo) return
        setLoading(false)
        if (d.telemetria) { telRef.current = { ...telRef.current, ...d.telemetria }; setTelemetria(telRef.current) }
        if (d.nutricion_ia && Object.keys(d.nutricion_ia).length) remoteNutri.current = JSON.stringify(d.nutricion_ia)
        if (d.perfil && d.perfil.foto_url && !fotoLocal(perfilRef.current.raza, perfilRef.current.etapa)) {
          setPerfil((p) => ({ ...p, foto_url: String(d.perfil.foto_url).replace('http://127.0.0.1:1880', BASE) }))
        }
        if (Array.isArray(d.activity_feed) && d.activity_feed.length) setFeed(d.activity_feed)
      } catch { nodeRed.current = { ok: false } /* Node-RED apagado */ }
    }
    sync()
    const iv = setInterval(sync, 4000)
    const t0 = setTimeout(() => cargarFoto(PERFIL0.raza, PERFIL0.etapa), 0)
    return () => {
      vivo = false
      clearTimeout(kill)
      clearTimeout(t0)
      clearInterval(iv)
      c.end(true)
    }
  }, [cargarFoto])

  // Consulta silenciosa al agente nutricional (Node-RED → Gemini). No muestra avisos en pantalla:
  // si responde con un plan nuevo se aplica; si falla o tarda solo se deja un console.debug.
  const consultarAgente = useCallback(async (p = perfilRef.current) => {
    const id = ++agenteReq.current
    if (demoRef.current || !REST_OK) return
    const t0 = performance.now()
    const seg = () => ((performance.now() - t0) / 1000).toFixed(1)
    const antes = remoteNutri.current
    let etapa = 'enviando perfil'
    try {
      const payload = { peso_kg: kgDe(p), etapa: p.etapa, actividad: p.actividad, auto: p.auto }
      const enviar = () => fetchJson(`${BASE}/api/petstation/comando`, 8000, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'perfil', ...payload, raza: p.raza }),
      })
      try { await enviar() } catch (e) {
        if (e instanceof TypeError) { await new Promise((r) => setTimeout(r, 600)); await enviar() } else throw e
      }
      etapa = 'esperando la recomendación'
      let nuevo = null
      while (id === agenteReq.current && performance.now() - t0 < 20000) {
        await new Promise((r) => setTimeout(r, 1500))
        const d = await fetchJson(`${BASE}/api/petstation/estado`, 5000)
        const n = d.nutricion_ia
        if (n?.error) throw new BackendError(String(n.error))
        if (n && Object.keys(n).length) {
          remoteNutri.current = JSON.stringify(n)
          if (JSON.stringify(n) !== antes) { nuevo = n; break }
        }
      }
      if (id !== agenteReq.current) return
      if (nuevo && Number(nuevo.gramos_por_toma) > 0) setNutricion((prev) => ({ ...prev, ...nuevo }))
      else throw new SinCambioError()
    } catch (err) {
      if (id !== agenteReq.current) return
      const dx = diagnosticar(err, etapa, seg(), nodeRed.current)
      console.debug('[PetCare IA]', dx.tipo, '·', dx.detalle, `(${seg()} s)`)
    }
  }, [kgDe])

  const agenteTimer = useRef(null)
  useEffect(() => () => clearTimeout(agenteTimer.current), [])

  const cambiarPerfil = useCallback((cambio) => {
    const nuevo = { ...perfilRef.current, ...cambio }
    perfilRef.current = nuevo
    setPerfil(nuevo)
    const nut = calcularNutricion(nuevo.raza, nuevo.etapa, nuevo.actividad, pesosRef.current[claveKg(nuevo.raza, nuevo.etapa)])
    setNutricion(nut)
    if (cambio.raza || cambio.etapa) cargarFoto(nuevo.raza, nuevo.etapa)
    const payload = { peso_kg: nut.peso_kg, etapa: nuevo.etapa, actividad: nuevo.actividad, auto: nuevo.auto }
    pub(T.perfil, JSON.stringify(payload))
    log(`Perfil actualizado: ${nuevo.raza} · ${nuevo.etapa} · ${nuevo.actividad}`)
    // Consulta en segundo plano (silenciosa); evita repetirla si el usuario cambia varias opciones seguidas
    clearTimeout(agenteTimer.current)
    agenteTimer.current = setTimeout(() => consultarAgente(nuevo), 700)
  }, [cargarFoto, pub, log, consultarAgente])

  // Registrar (o borrar con null) el peso real del perro para la raza y etapa actuales
  const setPesoPropio = useCallback((kg) => {
    const p = perfilRef.current
    const clave = claveKg(p.raza, p.etapa)
    const mapa = { ...pesosRef.current }
    if (kg == null) delete mapa[clave]; else mapa[clave] = kg
    pesosRef.current = mapa
    try { localStorage.setItem(LS_PESOS, JSON.stringify(mapa)) } catch { /* sin almacenamiento */ }
    const nut = calcularNutricion(p.raza, p.etapa, p.actividad, mapa[clave])
    setNutricion(nut)
    pub(T.perfil, JSON.stringify({ peso_kg: nut.peso_kg, etapa: p.etapa, actividad: p.actividad, auto: p.auto }))
    log(kg == null ? `Peso restablecido: ${nut.peso_kg} kg (estimado)` : `Peso registrado: ${kg} kg`)
  }, [pub, log])

  const setAuto = useCallback((auto) => {
    setPerfil((p) => ({ ...p, auto }))
    const p = perfilRef.current
    pub(T.perfil, JSON.stringify({ peso_kg: kgDe(p), etapa: p.etapa, actividad: p.actividad, auto }))
    post({ accion: 'auto_ia', auto })
    log(`Dispensado automático IA ${auto ? 'activado' : 'desactivado'}`)
  }, [pub, post, log, kgDe])

  const dispensarIA = useCallback(() => {
    pub(T.racion, 'IA')
    post({ accion: 'dispensar' })
    log(`Ración IA solicitada (${nutricionIA.gramos_por_toma} g)`)
  }, [pub, post, log, nutricionIA.gramos_por_toma])

  const dispensarManual = useCallback((gramos) => {
    const g = clamp(Number(gramos) || 5, 5, 85)
    pub(T.racion, JSON.stringify({ gramos: g }))
    post({ accion: 'dispensar', gramos: g })
    log(`Ración manual solicitada: ${g} g`)
  }, [pub, post, log])

  const tararBascula = useCallback(() => {
    pub(T.tare, '1')
    post({ accion: 'tare' })
    log('Báscula tarada a 0 g')
  }, [pub, post, log])

  const fijarHoraPrueba = useCallback((horaStr) => {
    const [h, m] = String(horaStr).split(':').map(Number)
    const p = perfilRef.current
    pub(T.perfil, JSON.stringify({ peso_kg: kgDe(p), etapa: p.etapa, actividad: p.actividad, auto: p.auto, hora_prueba: h, min_prueba: m }))
    post({ accion: 'hora_prueba', hora_prueba: horaStr })
    log(`Hora de prueba fijada: ${horaStr}`)
  }, [pub, post, log, kgDe])

  const setDemo = useCallback((on) => {
    demoRef.current = on
    setDemoState(on)
    if (on) {
      setTelDemo(TEL0)
      // Historial inicial para que la gráfica se vea viva desde el primer instante
      const semilla = [38, 34, 29, 23, 18, 12, 9, 45, 40, 35, 29, 24]
      setHistDemo(semilla.map((peso, i) => {
        const d = new Date(Date.now() - (semilla.length - i) * 90000)
        return { hora: d.toTimeString().slice(0, 5), peso, tolva: 0, agua: 0 }
      }))
      setFeedDemo([{ hora: hhmm(), mensaje: '(Demo) Vista previa activada: datos simulados, no se envían comandos.' }])
    }
  }, [])

  // Generador de lecturas simuladas
  useEffect(() => {
    if (!demo) return undefined
    let tick = 0
    let tolva = 24, tanque = 88, peso = 38
    const niveles = [100, 75, 50, 25]
    const id = setInterval(() => {
      tick++
      tolva -= 1.1
      if (tolva < 6) { tolva = 82; setFeedDemo((f) => [{ hora: hhmm(), mensaje: '(Demo) Tolva rellenada' }, ...f].slice(0, 40)) }
      tanque = tanque <= 20 ? 92 : tanque - 0.6
      if (tick % 8 === 0) {
        peso = 45
        setFeedDemo((f) => [{ hora: hhmm(), mensaje: '(Demo) Ración IA dispensada: 45 g' }, ...f].slice(0, 40))
      } else peso = Math.max(6, peso - 4 + (Math.random() * 3 - 1))
      const plato = niveles[Math.floor(tick / 4) % 4]
      const t = {
        peso: Math.round(peso),
        dosis_ia: Math.round(45 + (Math.random() * 6 - 3)),
        intervalo_ia: 6,
        tolva_comida: Math.round(tolva),
        tanque_agua: Math.round(tanque),
        nivel_agua_plato: plato,
        bomba_activa: plato <= 25,
      }
      setTelDemo(t)
      setHistDemo((h) => [...h, { hora: hhmm(), peso: t.peso, tolva: t.tolva_comida, agua: t.tanque_agua }].slice(-15))
    }, 1500)
    return () => clearInterval(id)
  }, [demo])

  const vista = demo
    ? { telemetria: telDemo, historial: histDemo, activityFeed: feedDemo, isInitialLoading: false }
    : { telemetria, historial, activityFeed, isInitialLoading }

  return useMemo(() => ({
    mqttOnline, perfil, nutricionIA, demo, setDemo, toast, ...vista,
    cambiarPerfil, setPesoPropio, setAuto, dispensarIA, dispensarManual, tararBascula, fijarHoraPrueba,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [mqttOnline, perfil, nutricionIA, demo, setDemo, toast, vista.telemetria, vista.historial, vista.activityFeed, vista.isInitialLoading,
    cambiarPerfil, setPesoPropio, setAuto, dispensarIA, dispensarManual, tararBascula, fijarHoraPrueba])
}

import { useState } from 'react'
import { LayoutGrid, PawPrint, Activity } from 'lucide-react'
import { usePetStation } from './hooks/usePetStation'
import { Logo, ThemeToggle, Toast } from './components/Shell'
import { useMedia, useTheme } from './lib/hooks'
import Hero from './components/bento/Hero'
import Plan from './components/bento/Plan'
import Dispensacion from './components/bento/Dispensacion'
import Sensores from './components/bento/Sensores'
import Analitica from './components/bento/Analitica'
import Bitacora from './components/bento/Bitacora'

const SECCIONES = [
  { id: 'cuidado', label: 'Cuidado', icon: PawPrint },
  { id: 'datos', label: 'Datos', icon: Activity },
]

// Bento de 12 columnas (en escritorio). Cada vista elige qué tarjetas muestra y cuánto ocupa cada una.
const VISTAS = {
  todo: [[Hero, 7], [Plan, 5], [Dispensacion, 5], [Sensores, 7], [Analitica, 7], [Bitacora, 5]],
  cuidado: [[Hero, 7], [Plan, 5], [Dispensacion, 12]],
  datos: [[Sensores, 12], [Analitica, 7], [Bitacora, 5]],
}
const SPAN = { 5: 'lg:col-span-5', 7: 'lg:col-span-7', 12: 'lg:col-span-12' }

export default function App() {
  const s = usePetStation()
  const [theme, toggleTheme] = useTheme()
  const desktop = useMedia('(min-width: 1024px)')
  const tablet = useMedia('(min-width: 768px)')
  // 'todo' = panel compuesto (solo escritorio); en tablet y móvil equivale a 'cuidado'
  const [tab, setTab] = useState('todo')
  const active = !desktop && tab === 'todo' ? 'cuidado' : tab
  const go = (id) => { setTab(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const tabs = desktop ? [{ id: 'todo', label: 'Panel', icon: LayoutGrid }, ...SECCIONES] : SECCIONES
  const tabCls = (id) => `flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors duration-200 ${active === id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-line/5 hover:text-fg'}`

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30">
        {/* Capa de fondo: degradado + desenfoque que se desvanece hacia abajo (sin línea ni borde inferior) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-canvas/95 via-canvas/85 to-canvas/0 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]" />
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:gap-6 lg:px-8">
          <button type="button" onClick={() => go(desktop ? 'todo' : 'cuidado')} className="flex items-center gap-3" aria-label="Inicio">
            <Logo />
            <span className="font-display text-sm font-semibold leading-tight tracking-tight text-fg sm:text-base">PetCare <span className="font-medium text-muted md:hidden lg:inline">SmartStation</span></span>
          </button>
          {tablet && (
            <nav className="flex gap-1 lg:ml-4" aria-label="Secciones">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => go(id)} aria-current={active === id ? 'page' : undefined} className={`${tabCls(id)} min-h-10`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </nav>
          )}
          <span className={`ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold ${s.mqttOnline ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.mqttOnline ? 'bg-ok' : 'animate-pulse bg-warn'}`} />
            {s.mqttOnline ? 'ONLINE · MQTT' : 'RECONECTANDO'}
          </span>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        {!tablet && (
          <nav className="mx-auto grid max-w-2xl grid-cols-2 gap-1 px-3 pb-2" aria-label="Secciones">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => go(id)} aria-current={active === id ? 'page' : undefined} className={`${tabCls(id)} min-h-11`}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main key={active} className={`view-enter mx-auto grid gap-5 px-4 pt-5 lg:grid-cols-12 lg:px-8 lg:pt-6 ${desktop ? 'max-w-[1440px]' : 'max-w-2xl'}`}>
        {VISTAS[active].map(([Card, span], i) => (
          <div key={i} className={`flex min-w-0 ${SPAN[span]}`}><Card s={s} /></div>
        ))}
      </main>

      <Toast toast={s.toast} />
    </div>
  )
}

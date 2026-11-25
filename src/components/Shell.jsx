import { CheckCircle2, FlaskConical, Moon, Sun } from 'lucide-react'
import { Switch } from './ui'

function ThemeToggle({ theme, onToggle }) {
  const light = theme === 'light'
  return (
    <button type="button" onClick={(e) => onToggle(e.currentTarget)} aria-label={light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-fg2 hover:bg-line/10">
      <Sun size={18} className={`theme-icon absolute ${light ? '' : '-rotate-90 scale-50 opacity-0'}`} />
      <Moon size={18} className={`theme-icon absolute ${light ? 'rotate-90 scale-50 opacity-0' : ''}`} />
    </button>
  )
}

export function Header({ s, theme, onTheme }) {
  return (
    <header className="sticky top-0 z-30 glass-bar border-b border-hairline">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:gap-4 lg:px-8">
        <img src="/logo-mark.png" alt="" width="34" height="34" className="h-[34px] w-[34px] object-contain" />
        <h1 className="font-display text-lg font-bold tracking-tight">PetCare<span className="hidden font-medium text-muted sm:inline"> SmartStation</span></h1>
        <span className={`ml-auto flex items-center gap-2 text-[13px] font-medium ${s.mqttOnline ? 'text-ok' : 'text-warn'}`}>
          <span className={`h-2 w-2 rounded-full ${s.mqttOnline ? 'bg-ok' : 'animate-pulse bg-warn'}`} />
          {s.mqttOnline ? 'Conectada' : 'Sin conexión'}
        </span>
        <Switch checked={s.demo} onChange={s.setDemo} className="hidden sm:flex">Simular</Switch>
        <ThemeToggle theme={theme} onToggle={onTheme} />
      </div>
      {s.demo && (
        <div className="bg-food/15 text-fg">
          <p className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-2 text-[13px] lg:px-8">
            <FlaskConical size={15} className="shrink-0 text-food" />
            <span>Datos simulados. Nada se envía a la estación y los cambios se descartan al salir.</span>
            <button type="button" onClick={() => s.setDemo(false)} className="ml-auto min-h-9 px-2 font-semibold underline underline-offset-4">Salir</button>
          </p>
        </div>
      )}
    </header>
  )
}

export function Toast({ toast }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className="toast-in flex max-w-md items-center gap-2.5 rounded-full bg-fg px-5 py-3 text-sm font-medium text-canvas">
          <CheckCircle2 size={16} className="shrink-0" /><span>{toast.msg}</span>
        </div>
      )}
    </div>
  )
}

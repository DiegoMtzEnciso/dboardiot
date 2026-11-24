import { CheckCircle2, Moon, Sun } from 'lucide-react'

export function ThemeToggle({ theme, onToggle }) {
  const light = theme === 'light'
  return (
    <button type="button" role="switch" aria-checked={light} onClick={(e) => onToggle(e.currentTarget)}
      aria-label={light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'} title={light ? 'Tema claro' : 'Tema oscuro'}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-fg2 ring-1 ring-hairline-strong transition-colors duration-200 hover:bg-line/5">
      <Sun size={18} className={`theme-icon absolute ${light ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} />
      <Moon size={18} className={`theme-icon absolute ${light ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
    </button>
  )
}

// Isotipo recortado al ras (public/logo-mark.png, fondo transparente: funciona en tema claro y oscuro)
export const Logo = () => (
  <img src="/logo-mark.png" alt="" aria-hidden="true" width="40" height="40" className="h-10 w-10 shrink-0 object-contain" />
)

// Aviso discreto de confirmación
export function Toast({ toast }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className="toast-in flex max-w-md items-center gap-2.5 glass rounded-2xl px-4 py-3 text-sm text-fg">
          <CheckCircle2 size={16} className="shrink-0 text-ok" />
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  )
}

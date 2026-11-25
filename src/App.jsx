import { useState } from 'react'
import { usePetStation } from './hooks/usePetStation'
import { useTheme } from './lib/hooks'
import { useDia } from './lib/dia'
import { Header, Toast } from './components/Shell'
import Mascota from './components/dashboard/Mascota'
import Avisos from './components/dashboard/Avisos'
import Dia from './components/dashboard/Dia'
import Servir from './components/dashboard/Servir'
import Niveles from './components/dashboard/Niveles'
import Historico from './components/dashboard/Historico'
import Bitacora from './components/dashboard/Bitacora'
import EditarPerfil from './components/dashboard/EditarPerfil'

export default function App() {
  const s = usePetStation()
  const dia = useDia(s)
  const [theme, onTheme] = useTheme()
  const [editando, setEditando] = useState(false)

  return (
    <div className="min-h-screen">
      <Header s={s} theme={theme} onTheme={onTheme} />
      <main className="mx-auto grid max-w-[1440px] gap-4 px-4 pb-24 pt-4 lg:pb-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:pt-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Escritorio: la tarjeta queda fija bajo la barra, a la altura de la ventana; solo se desplaza la columna derecha */}
        <aside className={`min-w-0 lg:sticky lg:self-start ${s.demo ? 'lg:top-[141px] lg:h-[calc(100dvh-165px)]' : 'lg:top-[89px] lg:h-[calc(100dvh-113px)]'}`}><Mascota s={s} dia={dia} onEditar={() => setEditando(true)} /></aside>
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          <Avisos s={s} />
          <Dia s={s} dia={dia} />
          <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-6">
            <Servir s={s} dia={dia} />
            <Niveles s={s} />
          </div>
          <div className="grid min-w-0 gap-4 lg:gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Historico s={s} />
            <Bitacora s={s} />
          </div>
        </div>
      </main>
      {editando && <EditarPerfil s={s} onCerrar={() => setEditando(false)} />}
      <Toast toast={s.toast} />
    </div>
  )
}

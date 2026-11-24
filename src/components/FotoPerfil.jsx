import { useState } from 'react'
import { PawPrint } from 'lucide-react'
import { fotosDe } from '../hooks/usePetStation'

// Foto limpia (sin texto encima). Con varias fotos: puntos discretos o toque para alternar.
export default function FotoPerfil({ perfil }) {
  const lista = fotosDe(perfil.raza, perfil.etapa)
  const [idx, setIdx] = useState(0)
  const actual = lista.length ? lista[idx % lista.length] : null
  const src = actual?.src ?? perfil.foto_url
  const multi = lista.length > 1
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface2 md:aspect-[4/5]">
      {src ? (
        <button type="button" disabled={!multi} onClick={() => setIdx((i) => (i + 1) % lista.length)}
          aria-label={multi ? 'Cambiar foto' : undefined} className={`block h-full w-full ${multi ? 'cursor-pointer' : 'cursor-default'}`}>
          <img key={src} src={src} alt={perfil.raza} className="photo-fade h-full w-full object-cover" style={{ objectPosition: actual?.pos ?? '50% 30%' }} />
        </button>
      ) : (
        <div className="flex h-full w-full items-center justify-center"><PawPrint size={56} className="text-faint" /></div>
      )}
      {multi && (
        <div className="absolute inset-x-0 bottom-2 flex justify-center">
          <div className="flex items-center rounded-full bg-black/50 px-1 backdrop-blur">
            {lista.map((_, i) => (
              <button key={i} type="button" onClick={() => setIdx(i)} aria-label={`Foto ${i + 1} de ${lista.length}`} aria-current={i === idx % lista.length}
                className="flex h-9 w-7 items-center justify-center">
                <span className={`h-2 rounded-full transition-all duration-200 ${i === idx % lista.length ? 'w-5 bg-sky-400' : 'w-2 bg-white/50'}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

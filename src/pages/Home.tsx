import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Album } from '../data/albums'
import { listAlbums } from '../data/albumsRepo'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function Home() {
  const [albums, setAlbums] = useState<Album[] | null>(null)

  useEffect(() => {
    let cancelled = false
    listAlbums().then((data) => {
      if (!cancelled) setAlbums(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-balance text-center text-5xl font-semibold tracking-tight">
          Nico González
        </h1>
        <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-white/60">
          Bienvenidos a mi portafolio fotográfico. En él pueden ver los álbumes de algún viaje u acceder a la galería general, donde hay fotos variadas.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {(albums ?? []).map((album) => (
          <Link
            key={album.slug}
            to={`/albums/${album.slug}`}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5"
          >
            <div className="aspect-16/10">
              <img
                src={album.coverSrc}
                alt={album.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
              />
            </div>

            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 opacity-0 ring-1 ring-cyan-400/25 transition duration-300 group-hover:opacity-100" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  {/* <p className="text-xs uppercase tracking-wide text-white/60">
                    {album.subtitle ?? 'Álbum'}
                  </p> */}
                  <h2 className="text-lg font-semibold tracking-tight text-white">
                    {album.title}
                  </h2>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">
                  {album.photos.length} fotos
                </span>
              </div>
            </div>
          </Link>
        ))}

        {albums !== null && albums.length === 0 ? (
          <div className="col-span-full flex min-h-[40vh] items-center justify-center">
            <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Sin álbumes para mostrar
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Volvé más tarde.
              </p>
            </div>
          </div>
        ) : null}

        {albums === null ? (
          <div className="col-span-full flex min-h-[50vh] items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
              <LoadingSpinner sizeClassName="h-8 w-8" />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

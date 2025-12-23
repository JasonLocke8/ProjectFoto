import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Album as AlbumType } from '../data/albums'
import { getAlbum } from '../data/albumsRepo'

export function Album() {
  const { slug } = useParams()
  const [album, setAlbum] = useState<AlbumType | null | undefined>(() =>
    slug ? null : undefined,
  )

  type AlbumPhoto = AlbumType['photos'][number]
  const [selectedPhoto, setSelectedPhoto] = useState<AlbumPhoto | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)

  function closeViewer() {
    setViewerOpen(false)
    window.setTimeout(() => {
      setSelectedPhoto(null)
    }, 180)
  }

  useEffect(() => {
    if (!selectedPhoto) return

    let cancelled = false
    const raf = window.requestAnimationFrame(() => {
      if (!cancelled) setViewerOpen(true)
    })

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeViewer()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selectedPhoto])

  useEffect(() => {
    let cancelled = false
    if (!slug) return
    getAlbum(slug).then((data) => {
      if (!cancelled) setAlbum(data)
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (album === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-white/60">Cargando…</p>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Álbum</h1>
        <p className="text-sm text-white/60">No encontré ese álbum.</p>
        <Link
          to="/"
          className="inline-flex items-center rounded-full bg-white/5 px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 hover:bg-white/10"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="relative">
          <Link
            to="/"
            aria-label="Volver"
            title="Volver"
            className="absolute left-0 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white hover:ring-white/20"
          >
            <span className="h-5 w-5">
              <ArrowLeftIcon />
            </span>
          </Link>

          <div className="px-12 text-center">
            <h1 className="text-balance text-5xl font-semibold tracking-tight">
              {album.title}
            </h1>
            {album.subtitle ? (
              <p className="mt-2 text-center text-sm text-white/60">
                {album.subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {album.photos.length === 0 ? (
        <section className="flex min-h-[40vh] items-center justify-center">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Sin fotos para ver
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Este álbum todavía no tiene fotos cargadas.
            </p>
            <div className="mt-4">
              <Link
                to="/"
                className="inline-flex items-center rounded-full bg-white/5 px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 hover:bg-white/10"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {album.photos.map((photo) => (
            <figure
              key={photo.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPhoto(photo)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedPhoto(photo)
              }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 outline-none ring-fuchsia-400/20 transition hover:ring-1 focus-visible:ring-2"
            >
              <div className="aspect-square">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-0 ring-1 ring-fuchsia-400/20" />

                {photo.location ? (
                  <div className="absolute right-2 top-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                      <span className="h-3.5 w-3.5">
                        <LocationPinIcon />
                      </span>
                      <span className="max-w-40 truncate">{photo.location}</span>
                    </span>
                  </div>
                ) : null}

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs">
                  <span className="truncate text-white/85">
                    {photo.caption ?? 'Foto'}
                  </span>
                  {photo.takenAt ? (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                      {formatPhotoDate(photo.takenAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            </figure>
          ))}
        </section>
      )}

      {selectedPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador de foto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeViewer()
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200 ${
              viewerOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <button
            type="button"
            aria-label="Cerrar"
            title="Cerrar"
            onClick={closeViewer}
            className={`absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white hover:ring-white/20 ${
              viewerOpen ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="h-5 w-5">
              <CloseIcon />
            </span>
          </button>

          <div
            className={`relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 ring-1 ring-white/10 backdrop-blur transition duration-200 ${
              viewerOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
            }`}
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/12 to-transparent opacity-60" />

            <div className="relative">
              <div className="flex max-h-[75vh] items-center justify-center bg-black/20">
                <img
                  src={selectedPhoto.src}
                  alt={selectedPhoto.alt}
                  className="max-h-[75vh] w-auto max-w-full object-contain"
                />
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm leading-relaxed text-white/80">
                    {selectedPhoto.caption ?? selectedPhoto.alt ?? 'Foto'}
                  </p>

                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    {selectedPhoto.takenAt ? (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                        {formatPhotoDate(selectedPhoto.takenAt)}
                      </span>
                    ) : null}

                    {selectedPhoto.location ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                        <span className="h-3.5 w-3.5">
                          <LocationPinIcon />
                        </span>
                        <span className="max-w-56 truncate">
                          {selectedPhoto.location}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatPhotoDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed)
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function LocationPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
      <path d="M12 10.25a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { LoadingSpinner } from '../components/LoadingSpinner'

type Social = {
  label: string
  href: string
  icon: ReactNode
}

const socials: Social[] = [
  { label: 'Instagram', href: 'https://www.instagram.com/nicolito.exe/', icon: <InstagramIcon /> },
  { label: 'VSCO', href: 'https://vsco.co/nicolito-exe/gallery', icon: <VscoIcon /> },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/nico-exe/', icon: <LinkedInIcon /> },
]

export function About() {
  const [profileSrc, setProfileSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!isSupabaseConfigured || !supabase) {
      return
    }

    const client = supabase

    const bucket =
      (import.meta.env.VITE_SUPABASE_BUCKET as string | undefined) ?? 'photos'
    const objectPath = 'img/perfil.jpg'
    const { data } = client.storage.from(bucket).getPublicUrl(objectPath)
    const baseUrl = data.publicUrl

    async function resolveVersionedUrl() {
      try {
        const { data: objects, error } = await client.storage
          .from(bucket)
          .list('img', { search: 'perfil.jpg', limit: 1 })

        const updatedAt =
          !error && objects?.length
            ? (objects.find((o) => o.name === 'perfil.jpg')?.updated_at ??
              objects[0]?.updated_at)
            : undefined

        const version = updatedAt
          ? new Date(updatedAt).getTime().toString()
          : Date.now().toString()

        if (!cancelled) {
          setProfileSrc(`${baseUrl}?v=${encodeURIComponent(version)}`)
        }
      } catch {
        if (!cancelled) {
          setProfileSrc(`${baseUrl}?v=${Date.now()}`)
        }
      }
    }

    resolveVersionedUrl()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-linear-to-r from-cyan-400/35 via-fuchsia-500/30 to-cyan-400/35 blur" />
            <div className="relative rounded-full p-1 ring-1 ring-white/10">
              {profileSrc ? (
                <img
                  src={profileSrc}
                  alt="Foto de perfil"
                  className="h-24 w-24 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          </div>

          <h1 className="mt-4 text-balance text-2xl font-semibold tracking-tight">
            Sobre mí
          </h1>
          

          {/* <div className="mt-4 flex items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                title={s.label}
                className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white hover:ring-white/20"
              >
                <span className="h-5 w-5">{s.icon}</span>
              </a>
            ))}
          </div> */}

        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">

        <Card title="Biografía">
          <p className="text-sm leading-relaxed text-white/70">
            Me llamo Nicolás, soy developer, pero me gusta la fotografía. Soy un apacionado por la tecnología y me encanta capturar momentos a través de mi celular/cámara. En este portafolio comparto algunas de mis fotos, tomadas en viajes o momentos aleatorios. Dejo algunas de mis redes por si quieres conactarte conmigo.

          </p>
        </Card>

        <Card title="Equipo">
          <dl className="space-y-3 text-sm">
            <Row label="Cámara" value="Nikon Coolpix L320" />
            <Row label="Lente" value="Inexistente" />
            <Row label="Edición" value="Lightroom / Photoshop" />
          </dl>
        </Card>

        <Card title="Redes">
          <div className="flex flex-wrap items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm text-white/75 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white hover:ring-white/20"
              >
                <span className="h-4 w-4 text-white/80">{s.icon}</span>
                <span className="leading-none">{s.label}</span>
              </a>
            ))}
          </div>
        </Card>



        <Card title="Contacto">
          <div className="space-y-2 text-sm">
            <p className="text-white/70">Email: nicogonzalez2000@gmail.com</p>
            <p className="text-white/70">Ubicación: Montevideo, Uruguay</p>
          </div>
        </Card>
      </section>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/12 to-transparent opacity-60" />
      <div className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-cyan-400/10" />
      <div className="relative">
        <h2 className="text-sm font-medium tracking-wide text-white/90">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/50">{label}</dt>
      <dd className="text-right text-white/80">{value}</dd>
    </div>
  )
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M16 11.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  )
}

function VscoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path d="M6 10v10" />
      <path d="M6 7.5v.1" />
      <path d="M10 20v-7a3 3 0 0 1 6 0v7" />
      <path d="M10 13v7" />
      <path d="M18 20v-7" />
      <path d="M4 4h16v16H4z" />
    </svg>
  )
}

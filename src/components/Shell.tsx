import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-80 w-2xl -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-80 w-2xl -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-medium tracking-wide text-white/90">
              ProjectFoto
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <NavItem to="/">Inicio</NavItem>
            <NavItem to="/about">Sobre mí</NavItem>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {children}
      </main>

      <footer className="relative border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-white/50">
          <span>© {new Date().getFullYear()} ProjectFoto</span>
          <span className="flex items-center gap-2">
            <span className="text-white/50 leading-none">Hecho por Nicolás González</span>
            <a
              href="https://www.linkedin.com/in/nico-exe/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/60 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white hover:ring-white/20"
            >
              <span className="flex h-4 w-4 items-center justify-center">
                <LinkedInIcon />
              </span>
            </a>
            <a
              href="https://github.com/JasonLocke8"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/60 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white hover:ring-white/20"
            >
              <span className="flex h-4 w-4 items-center justify-center">
                <GitHubIcon />
              </span>
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}

function NavItem({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'rounded-full px-3 py-1.5 text-sm transition',
          'ring-1 ring-white/10 hover:ring-white/20',
          'bg-white/5 hover:bg-white/10',
          isActive ? 'text-white' : 'text-white/70',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
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
      <path d="M4 4h16v16H4z" />
      <path d="M7 10v7" />
      <path d="M7 7.5v.1" />
      <path d="M11 20v-7a3 3 0 0 1 6 0v7" />
    </svg>
  )
}

function GitHubIcon() {
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
      <path d="M9 19c-4 1.5-4-2.5-5-3" />
      <path d="M14 22v-3.5c0-1 .1-1.7-.4-2.3 1.7-.2 3.4-.8 3.4-3.8 0-.8-.3-1.5-.8-2.1.1-.2.3-1-.1-2.1 0 0-.7-.2-2.2.8-.7-.2-1.4-.3-2.2-.3s-1.5.1-2.2.3c-1.5-1-2.2-.8-2.2-.8-.4 1.1-.2 1.9-.1 2.1-.5.6-.8 1.3-.8 2.1 0 3 1.7 3.6 3.4 3.8-.3.4-.4.9-.4 1.5V22" />
      <path d="M12 2c5.5 0 10 4.5 10 10 0 4.4-2.9 8.2-6.9 9.5" />
      <path d="M2 12C2 6.5 6.5 2 12 2" />
    </svg>
  )
}

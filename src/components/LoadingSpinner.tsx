type LoadingSpinnerProps = {
  sizeClassName?: string
  className?: string
  label?: string
}

export function LoadingSpinner({
  sizeClassName = 'h-7 w-7',
  className = 'text-white/70',
  label = 'Cargando',
}: LoadingSpinnerProps) {
  return (
    <span className={`${sizeClassName} ${className}`} aria-label={label}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-full w-full animate-spin"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.25"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

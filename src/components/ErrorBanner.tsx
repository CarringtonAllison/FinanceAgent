interface ErrorBannerProps {
  message: string
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      data-testid="error-banner"
      className="flex items-center justify-between gap-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400"
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 rounded p-1 hover:bg-red-400/20 transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

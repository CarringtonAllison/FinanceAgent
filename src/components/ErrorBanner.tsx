import { useEffect } from 'react'

interface ErrorBannerProps {
  message: string
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])
  return (
    <div
      data-testid="error-banner"
      className="flex items-center justify-between gap-4 rounded-lg border border-[#F4532B]/30 bg-[#F4532B]/10 px-4 py-3 text-sm text-[#F4532B]"
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 rounded p-1 hover:bg-[#F4532B]/20 transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

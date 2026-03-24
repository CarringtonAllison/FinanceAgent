import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { ErrorBanner } from './ErrorBanner'

describe('ErrorBanner', () => {
  it('renders the message text', () => {
    render(<ErrorBanner message="Something went wrong." onDismiss={vi.fn()} />)
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })

  it('renders a dismiss button', () => {
    render(<ErrorBanner message="Error" onDismiss={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn()
    render(<ErrorBanner message="Error" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('has testid error-banner', () => {
    render(<ErrorBanner message="Error" onDismiss={vi.fn()} />)
    expect(screen.getByTestId('error-banner')).toBeInTheDocument()
  })

  describe('auto-dismiss', () => {
    afterEach(() => { vi.useRealTimers() })

    it('calls onDismiss automatically after 5 seconds', () => {
      vi.useFakeTimers()
      const onDismiss = vi.fn()
      render(<ErrorBanner message="Error" onDismiss={onDismiss} />)
      expect(onDismiss).not.toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(5000) })
      expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('does not call onDismiss before 5 seconds', () => {
      vi.useFakeTimers()
      const onDismiss = vi.fn()
      render(<ErrorBanner message="Error" onDismiss={onDismiss} />)
      act(() => { vi.advanceTimersByTime(4999) })
      expect(onDismiss).not.toHaveBeenCalled()
    })
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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
})

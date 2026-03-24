import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

// Mock EventSource globally
class MockEventSource {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  close = vi.fn()
  constructor(public url: string) {}
}
vi.stubGlobal('EventSource', MockEventSource)

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the app title', () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok', service: 'finance-agent' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ cash_balance: 0, total_value: 0, positions: [], total_unrealized_pnl: 0 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ trades: [] }), { status: 200 }))
    render(<App />)
    expect(screen.getByText('Finance Agent')).toBeInTheDocument()
  })

  it('shows connecting status initially', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
    render(<App />)
    expect(screen.getByText(/connecting/i)).toBeInTheDocument()
  })

  it('shows backend connected when health check succeeds', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok', service: 'finance-agent' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ cash_balance: 0, total_value: 0, positions: [], total_unrealized_pnl: 0 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ trades: [] }), { status: 200 }))
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/backend connected/i)).toBeInTheDocument()
    })
  })

  it('shows backend offline when health check fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/backend offline/i)).toBeInTheDocument()
    })
  })

  it('shows error banner when analyze fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ cash_balance: 1000, total_value: 1000, positions: [], total_unrealized_pnl: 0 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ trades: [] }), { status: 200 }))
      .mockRejectedValueOnce(new Error('Network error'))

    render(<App />)
    await waitFor(() => screen.getByText(/backend connected/i))

    const input = screen.getByPlaceholderText('AAPL')
    await userEvent.type(input, 'AAPL')
    await userEvent.click(screen.getByRole('button', { name: /analyze/i }))

    await waitFor(() => {
      expect(screen.getByTestId('error-banner')).toBeInTheDocument()
    })
  })

  it('dismisses error banner when dismiss is clicked', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ cash_balance: 1000, total_value: 1000, positions: [], total_unrealized_pnl: 0 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ trades: [] }), { status: 200 }))
      .mockRejectedValueOnce(new Error('Network error'))

    render(<App />)
    await waitFor(() => screen.getByText(/backend connected/i))

    const input = screen.getByPlaceholderText('AAPL')
    await userEvent.type(input, 'AAPL')
    await userEvent.click(screen.getByRole('button', { name: /analyze/i }))

    await waitFor(() => screen.getByTestId('error-banner'))
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))

    expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument()
  })
})

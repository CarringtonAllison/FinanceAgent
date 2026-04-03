import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { TradePanel } from './TradePanel'

describe('TradePanel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders ticker input pre-filled with prop', () => {
    render(<TradePanel ticker="AAPL" onTradeExecuted={vi.fn()} />)
    expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument()
  })

  it('renders BUY button', () => {
    render(<TradePanel ticker="AAPL" onTradeExecuted={vi.fn()} />)
    expect(screen.getByRole('button', { name: /buy/i })).toBeInTheDocument()
  })

  it('renders SELL button', () => {
    render(<TradePanel ticker="AAPL" onTradeExecuted={vi.fn()} />)
    expect(screen.getByRole('button', { name: /sell/i })).toBeInTheDocument()
  })

  it('renders shares input', () => {
    render(<TradePanel ticker="AAPL" onTradeExecuted={vi.fn()} />)
    expect(screen.getByLabelText('Shares')).toBeInTheDocument()
  })

  it('calls fetch with correct body on BUY submit', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ trade: {}, portfolio: {} }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<TradePanel ticker="AAPL" onTradeExecuted={vi.fn()} />)
    await userEvent.clear(screen.getByLabelText('Shares'))
    await userEvent.type(screen.getByLabelText('Shares'), '3')
    await userEvent.click(screen.getByRole('button', { name: /buy/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/portfolio/trade',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ticker: 'AAPL', action: 'BUY', shares: 3 }),
        }),
      )
    })
  })

  it('calls onTradeExecuted on success', async () => {
    const onTradeExecuted = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ trade: {}, portfolio: {} }),
    }))

    render(<TradePanel ticker="TSLA" onTradeExecuted={onTradeExecuted} />)
    await userEvent.clear(screen.getByLabelText('Shares'))
    await userEvent.type(screen.getByLabelText('Shares'), '1')
    await userEvent.click(screen.getByRole('button', { name: /buy/i }))

    await waitFor(() => expect(onTradeExecuted).toHaveBeenCalled())
  })

  it('updates ticker input when ticker prop changes', async () => {
    const { rerender } = render(<TradePanel ticker="AAPL" onTradeExecuted={vi.fn()} />)
    expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument()
    rerender(<TradePanel ticker="TSLA" onTradeExecuted={vi.fn()} />)
    expect(screen.getByDisplayValue('TSLA')).toBeInTheDocument()
  })

  it('shows error message on 400 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'insufficient cash: need 9999.00, have 100.00' }),
    }))

    render(<TradePanel ticker="AAPL" onTradeExecuted={vi.fn()} />)
    await userEvent.clear(screen.getByLabelText('Shares'))
    await userEvent.type(screen.getByLabelText('Shares'), '100')
    await userEvent.click(screen.getByRole('button', { name: /buy/i }))

    await waitFor(() => expect(screen.getByText(/insufficient cash/i)).toBeInTheDocument())
  })
})

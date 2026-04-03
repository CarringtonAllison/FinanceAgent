import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

// Mock EventSource globally
class MockEventSource {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2
  static instances: MockEventSource[] = []
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  close = vi.fn()
  constructor(public url: string) {
    MockEventSource.instances.push(this)
  }
}
vi.stubGlobal('EventSource', MockEventSource)

function fireSse(es: MockEventSource, payload: object) {
  es.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent)
}

const healthOk = () => new Response(JSON.stringify({ status: 'ok', service: 'finance-agent' }), { status: 200 })
const portfolioOk = () => new Response(JSON.stringify({ cash_balance: 1000, total_value: 1000, positions: [], total_unrealized_pnl: 0 }), { status: 200 })
const tradesOk = () => new Response(JSON.stringify({ trades: [] }), { status: 200 })
const barsOk = () => new Response(JSON.stringify({ ticker: 'AAPL', bars: [] }), { status: 200 })

async function setupAndAnalyze() {
  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(healthOk())
    .mockResolvedValueOnce(portfolioOk())
    .mockResolvedValueOnce(tradesOk())
    .mockResolvedValueOnce(barsOk())

  render(<App />)
  await waitFor(() => screen.getByText(/backend connected/i))

  const input = screen.getByPlaceholderText('AAPL')
  await userEvent.type(input, 'AAPL')
  await userEvent.click(screen.getByRole('button', { name: /analyze/i }))

  await waitFor(() => {
    const es = MockEventSource.instances.find(i => i.url.includes('orchestrate'))
    expect(es).not.toBeUndefined()
  })
  return MockEventSource.instances.find(i => i.url.includes('orchestrate'))!
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    MockEventSource.instances = []
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

  it('shows sentiment failure message when sentiment agent errors and pipeline completes', async () => {
    const es = await setupAndAnalyze()

    fireSse(es, { agent: 'market_data', status: 'running', result: null })
    fireSse(es, { agent: 'market_data', status: 'complete', result: { ticker: 'AAPL', price: 200 } })
    fireSse(es, { agent: 'technical_analysis', status: 'complete', result: {} })
    fireSse(es, { agent: 'sentiment', status: 'error', result: { error: 'News service unavailable' } })
    fireSse(es, { agent: 'recommendation', status: 'complete', result: { action: 'HOLD', confidence: 0.5, reasoning: 'Limited data.', key_factors: [], risk_level: 'medium', time_horizon: 'short', entry_price: null, stop_loss: null, target_price: null } })
    fireSse(es, { agent: 'done', status: 'complete', result: {}, report: 'AAPL_test.json' })

    await waitFor(() => {
      expect(screen.getByText(/could not be completed/i)).toBeInTheDocument()
    })
  })

  it('shows recommendation failure message when recommendation agent errors and pipeline completes', async () => {
    const es = await setupAndAnalyze()

    fireSse(es, { agent: 'market_data', status: 'complete', result: { ticker: 'AAPL', price: 200 } })
    fireSse(es, { agent: 'technical_analysis', status: 'complete', result: {} })
    fireSse(es, { agent: 'sentiment', status: 'complete', result: { score: 'bullish', confidence: 0.8, headlines: [], key_themes: [], reasoning: 'Good news.' } })
    fireSse(es, { agent: 'recommendation', status: 'error', result: { error: 'AI service error' } })
    fireSse(es, { agent: 'done', status: 'complete', result: {}, report: 'AAPL_test.json' })

    await waitFor(() => {
      expect(screen.getByText(/could not be generated/i)).toBeInTheDocument()
    })
  })

  it('does not show loading spinner for a card when its agent has already errored', async () => {
    const es = await setupAndAnalyze()

    fireSse(es, { agent: 'sentiment', status: 'error', result: { error: 'News service unavailable' } })

    await waitFor(() => {
      expect(screen.queryByText(/analyzing sentiment/i)).not.toBeInTheDocument()
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

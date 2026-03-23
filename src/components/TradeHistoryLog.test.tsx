import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TradeHistoryLog } from './TradeHistoryLog'
import type { Trade } from './TradeHistoryLog'

const TRADES: Trade[] = [
  {
    id: 2,
    ticker: 'TSLA',
    action: 'SELL',
    shares: 1,
    price: 220,
    total: 220,
    createdAt: '2026-03-23T11:00:00+00:00',
  },
  {
    id: 1,
    ticker: 'AAPL',
    action: 'BUY',
    shares: 5,
    price: 100,
    total: 500,
    createdAt: '2026-03-23T10:00:00+00:00',
  },
]

describe('TradeHistoryLog', () => {
  it('renders trade rows', () => {
    render(<TradeHistoryLog trades={TRADES} loading={false} />)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('TSLA')).toBeInTheDocument()
  })

  it('shows BUY badge for buy trades', () => {
    render(<TradeHistoryLog trades={TRADES} loading={false} />)
    expect(screen.getByText('BUY')).toBeInTheDocument()
  })

  it('shows SELL badge for sell trades', () => {
    render(<TradeHistoryLog trades={TRADES} loading={false} />)
    expect(screen.getByText('SELL')).toBeInTheDocument()
  })

  it('shows empty state when no trades', () => {
    render(<TradeHistoryLog trades={[]} loading={false} />)
    expect(screen.getByText(/no trades/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<TradeHistoryLog trades={[]} loading={true} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PositionsTable } from './PositionsTable'
import type { Position } from './PositionsTable'

const POSITIONS: Position[] = [
  {
    ticker: 'AAPL',
    shares: 5,
    avgCost: 100,
    currentPrice: 120,
    marketValue: 600,
    unrealizedPnl: 100,
    unrealizedPnlPct: 20,
  },
  {
    ticker: 'TSLA',
    shares: 2,
    avgCost: 200,
    currentPrice: 180,
    marketValue: 360,
    unrealizedPnl: -40,
    unrealizedPnlPct: -10,
  },
]

describe('PositionsTable', () => {
  it('renders column headers', () => {
    render(<PositionsTable positions={POSITIONS} loading={false} />)
    expect(screen.getByText(/ticker/i)).toBeInTheDocument()
    expect(screen.getByText(/shares/i)).toBeInTheDocument()
    expect(screen.getByText(/avg cost/i)).toBeInTheDocument()
  })

  it('renders a row per position', () => {
    render(<PositionsTable positions={POSITIONS} loading={false} />)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('TSLA')).toBeInTheDocument()
  })

  it('shows positive P&L in green', () => {
    render(<PositionsTable positions={[POSITIONS[0]]} loading={false} />)
    const pnl = screen.getByTestId('pnl-AAPL')
    expect(pnl.className).toMatch(/green/)
  })

  it('shows negative P&L in red', () => {
    render(<PositionsTable positions={[POSITIONS[1]]} loading={false} />)
    const pnl = screen.getByTestId('pnl-TSLA')
    expect(pnl.className).toMatch(/red/)
  })

  it('shows empty state when positions is empty', () => {
    render(<PositionsTable positions={[]} loading={false} />)
    expect(screen.getByText(/no open positions/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<PositionsTable positions={[]} loading={true} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

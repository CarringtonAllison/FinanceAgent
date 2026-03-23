import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PortfolioBar } from './PortfolioBar'

describe('PortfolioBar', () => {
  it('renders cash balance as currency', () => {
    render(<PortfolioBar cashBalance={500} totalValue={1100} totalUnrealizedPnl={100} loading={false} />)
    expect(screen.getByText(/\$500\.00/)).toBeInTheDocument()
  })

  it('renders total value as currency', () => {
    render(<PortfolioBar cashBalance={500} totalValue={1100} totalUnrealizedPnl={100} loading={false} />)
    expect(screen.getByText(/\$1,100\.00/)).toBeInTheDocument()
  })

  it('renders positive P&L in green', () => {
    render(<PortfolioBar cashBalance={500} totalValue={1100} totalUnrealizedPnl={100} loading={false} />)
    const pnl = screen.getByTestId('pnl')
    expect(pnl.className).toMatch(/green/)
  })

  it('renders negative P&L in red', () => {
    render(<PortfolioBar cashBalance={500} totalValue={900} totalUnrealizedPnl={-100} loading={false} />)
    const pnl = screen.getByTestId('pnl')
    expect(pnl.className).toMatch(/red/)
  })

  it('renders zero P&L in slate', () => {
    render(<PortfolioBar cashBalance={1000} totalValue={1000} totalUnrealizedPnl={0} loading={false} />)
    const pnl = screen.getByTestId('pnl')
    expect(pnl.className).toMatch(/slate/)
  })

  it('renders skeleton shimmer when loading is true', () => {
    const { container } = render(<PortfolioBar cashBalance={0} totalValue={0} totalUnrealizedPnl={0} loading={true} />)
    expect(container.querySelector('[data-testid="portfolio-skeleton"]')).toBeInTheDocument()
  })
})

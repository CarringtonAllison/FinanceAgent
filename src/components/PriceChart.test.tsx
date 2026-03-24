import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PriceChart } from './PriceChart'

const MOCK_BARS = [
  { time: 1700000000 as number, open: 213.0, high: 214.5, low: 212.0, close: 213.5, volume: 1234567 },
]

describe('PriceChart', () => {
  it('renders a chart container', () => {
    render(<PriceChart bars={MOCK_BARS} ticker="AAPL" streamUrl={null} />)
    expect(screen.getByTestId('price-chart')).toBeInTheDocument()
  })

  it('renders ticker label', () => {
    render(<PriceChart bars={MOCK_BARS} ticker="AAPL" streamUrl={null} />)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
  })

  it('renders with empty bars without crashing', () => {
    render(<PriceChart bars={[]} ticker="AAPL" streamUrl={null} />)
    expect(screen.getByTestId('price-chart')).toBeInTheDocument()
  })

  it('renders placeholder when ticker is null', () => {
    render(<PriceChart bars={[]} ticker={null} streamUrl={null} />)
    expect(screen.getByTestId('price-chart-placeholder')).toBeInTheDocument()
  })
})

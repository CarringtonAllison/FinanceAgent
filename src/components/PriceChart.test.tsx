import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeAll } from 'vitest'
import { PriceChart } from './PriceChart'

// lightweight-charts requires a real DOM canvas — mock it for jsdom
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(),
    stroke: vi.fn(), fill: vi.fn(), measureText: vi.fn(() => ({ width: 0 })),
    scale: vi.fn(), translate: vi.fn(), save: vi.fn(), restore: vi.fn(),
    lineTo: vi.fn(), moveTo: vi.fn(), arc: vi.fn(), rect: vi.fn(),
    setTransform: vi.fn(), createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(), clip: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext
})

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

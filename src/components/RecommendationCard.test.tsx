import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecommendationCard } from './RecommendationCard'
import type { RecommendationResult } from './RecommendationCard'

const BUY: RecommendationResult = {
  action: 'BUY',
  confidence: 0.81,
  reasoning: 'Strong technical signals combined with bullish sentiment suggest upward momentum.',
  key_factors: ['RSI in bullish zone', 'MACD crossover', 'Positive news sentiment'],
  risk_level: 'medium',
  time_horizon: 'short',
  entry_price: 213.50,
  stop_loss: 210.00,
  target_price: 220.00,
}

const SELL: RecommendationResult = {
  action: 'SELL',
  confidence: 0.65,
  reasoning: 'Bearish indicators dominate with declining volume.',
  key_factors: ['Overbought RSI', 'MACD bearish crossover'],
  risk_level: 'high',
  time_horizon: 'short',
  entry_price: null,
  stop_loss: null,
  target_price: null,
}

const HOLD: RecommendationResult = {
  action: 'HOLD',
  confidence: 0.5,
  reasoning: 'Mixed signals — no clear edge in either direction.',
  key_factors: [],
  risk_level: 'low',
  time_horizon: 'medium',
  entry_price: null,
  stop_loss: null,
  target_price: null,
}

describe('RecommendationCard', () => {
  it('renders loading state when loading is true', () => {
    render(<RecommendationCard recommendation={null} loading={true} />)
    expect(screen.getByText(/generating/i)).toBeInTheDocument()
  })

  it('renders nothing meaningful when not loading and no recommendation', () => {
    const { container } = render(<RecommendationCard recommendation={null} loading={false} />)
    expect(container.firstChild).toBeEmptyDOMElement()
  })

  it('displays BUY action', () => {
    render(<RecommendationCard recommendation={BUY} loading={false} />)
    expect(screen.getByText('BUY')).toBeInTheDocument()
  })

  it('displays SELL action', () => {
    render(<RecommendationCard recommendation={SELL} loading={false} />)
    expect(screen.getByText('SELL')).toBeInTheDocument()
  })

  it('displays HOLD action', () => {
    render(<RecommendationCard recommendation={HOLD} loading={false} />)
    expect(screen.getByText('HOLD')).toBeInTheDocument()
  })

  it('shows confidence as a percentage', () => {
    render(<RecommendationCard recommendation={BUY} loading={false} />)
    expect(screen.getByText(/81%/)).toBeInTheDocument()
  })

  it('shows reasoning paragraph', () => {
    render(<RecommendationCard recommendation={BUY} loading={false} />)
    expect(screen.getByText(BUY.reasoning)).toBeInTheDocument()
  })

  it('renders a confidence bar element', () => {
    render(<RecommendationCard recommendation={BUY} loading={false} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toBeInTheDocument()
  })

  it('shows key factors list', () => {
    render(<RecommendationCard recommendation={BUY} loading={false} />)
    expect(screen.getByText('RSI in bullish zone')).toBeInTheDocument()
  })

  it('shows risk level', () => {
    render(<RecommendationCard recommendation={BUY} loading={false} />)
    expect(screen.getByText(/medium/i)).toBeInTheDocument()
  })

  it('shows price levels when present', () => {
    render(<RecommendationCard recommendation={BUY} loading={false} />)
    expect(screen.getByText('$213.50')).toBeInTheDocument()
    expect(screen.getByText('$210.00')).toBeInTheDocument()
    expect(screen.getByText('$220.00')).toBeInTheDocument()
  })

  it('does not render price levels section when all are null', () => {
    render(<RecommendationCard recommendation={HOLD} loading={false} />)
    expect(screen.queryByText('Entry')).not.toBeInTheDocument()
  })

  it('shows failure message when failed is true and no recommendation', () => {
    render(<RecommendationCard recommendation={null} loading={false} failed={true} />)
    expect(screen.getByText(/could not be generated/i)).toBeInTheDocument()
  })

  it('renders normally when failed is true but recommendation is present', () => {
    render(<RecommendationCard recommendation={BUY} loading={false} failed={true} />)
    expect(screen.getByText('BUY')).toBeInTheDocument()
    expect(screen.queryByText(/could not be generated/i)).not.toBeInTheDocument()
  })
})

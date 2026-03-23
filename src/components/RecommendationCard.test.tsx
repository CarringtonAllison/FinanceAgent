import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecommendationCard } from './RecommendationCard'
import type { RecommendationResult } from './RecommendationCard'

const BUY: RecommendationResult = {
  action: 'BUY',
  confidence: 0.81,
  reasoning: 'Strong technical signals combined with bullish sentiment suggest upward momentum.',
}

const SELL: RecommendationResult = {
  action: 'SELL',
  confidence: 0.65,
  reasoning: 'Bearish indicators dominate with declining volume.',
}

const HOLD: RecommendationResult = {
  action: 'HOLD',
  confidence: 0.5,
  reasoning: 'Mixed signals — no clear edge in either direction.',
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
})

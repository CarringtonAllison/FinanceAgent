import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SentimentCard } from './SentimentCard'
import type { SentimentResult } from './SentimentCard'

const BULLISH: SentimentResult = {
  score: 'bullish',
  confidence: 0.85,
  headlines: ['Apple beats earnings', 'iPhone sales surge', 'Analysts upgrade AAPL'],
  reasoning: 'Strong positive momentum across all major news sources.',
}

const BEARISH: SentimentResult = {
  score: 'bearish',
  confidence: 0.72,
  headlines: ['Apple misses revenue', 'Supply chain concerns'],
  reasoning: 'Negative sentiment driven by supply constraints.',
}

const NEUTRAL: SentimentResult = {
  score: 'neutral',
  confidence: 0.5,
  headlines: [],
  reasoning: 'Mixed signals with no clear direction.',
}

describe('SentimentCard', () => {
  it('renders loading state when loading is true', () => {
    render(<SentimentCard sentiment={null} loading={true} />)
    expect(screen.getByText(/analyzing/i)).toBeInTheDocument()
  })

  it('renders nothing meaningful when not loading and no sentiment', () => {
    const { container } = render(<SentimentCard sentiment={null} loading={false} />)
    expect(container.firstChild).toBeEmptyDOMElement()
  })

  it('shows bullish score badge', () => {
    render(<SentimentCard sentiment={BULLISH} loading={false} />)
    expect(screen.getByText(/bullish/i)).toBeInTheDocument()
  })

  it('shows bearish score badge', () => {
    render(<SentimentCard sentiment={BEARISH} loading={false} />)
    expect(screen.getByText(/bearish/i)).toBeInTheDocument()
  })

  it('shows neutral score badge', () => {
    render(<SentimentCard sentiment={NEUTRAL} loading={false} />)
    expect(screen.getByText(/neutral/i)).toBeInTheDocument()
  })

  it('shows confidence as a percentage', () => {
    render(<SentimentCard sentiment={BULLISH} loading={false} />)
    expect(screen.getByText(/85%/)).toBeInTheDocument()
  })

  it('renders up to 5 headlines', () => {
    const many: SentimentResult = {
      ...BULLISH,
      headlines: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7'],
    }
    render(<SentimentCard sentiment={many} loading={false} />)
    expect(screen.getByText('h5')).toBeInTheDocument()
    expect(screen.queryByText('h6')).not.toBeInTheDocument()
  })

  it('shows reasoning text', () => {
    render(<SentimentCard sentiment={BULLISH} loading={false} />)
    expect(screen.getByText(BULLISH.reasoning)).toBeInTheDocument()
  })

  it('renders gracefully with empty headlines', () => {
    render(<SentimentCard sentiment={NEUTRAL} loading={false} />)
    expect(screen.getByText(/neutral/i)).toBeInTheDocument()
  })
})

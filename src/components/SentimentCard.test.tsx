import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SentimentCard } from './SentimentCard'
import type { SentimentResult } from './SentimentCard'

const BULLISH: SentimentResult = {
  score: 'bullish',
  confidence: 0.85,
  headlines: [
    { title: 'Apple beats earnings', url: 'https://example.com/1' },
    { title: 'iPhone sales surge', url: 'https://example.com/2' },
    { title: 'Analysts upgrade AAPL', url: 'https://example.com/3' },
  ],
  key_themes: ['earnings beat', 'analyst upgrades'],
  reasoning: 'Strong positive momentum across all major news sources.',
}

const BEARISH: SentimentResult = {
  score: 'bearish',
  confidence: 0.72,
  headlines: [
    { title: 'Apple misses revenue', url: 'https://example.com/4' },
    { title: 'Supply chain concerns', url: 'https://example.com/5' },
  ],
  key_themes: ['supply chain', 'revenue miss'],
  reasoning: 'Negative sentiment driven by supply constraints.',
}

const NEUTRAL: SentimentResult = {
  score: 'neutral',
  confidence: 0.5,
  headlines: [],
  key_themes: [],
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

  it('renders headlines as links opening in a new tab', () => {
    render(<SentimentCard sentiment={BULLISH} loading={false} />)
    const link = screen.getByRole('link', { name: 'Apple beats earnings' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com/1')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders up to 5 headlines', () => {
    const many: SentimentResult = {
      ...BULLISH,
      headlines: [
        { title: 'h1', url: 'https://example.com/h1' },
        { title: 'h2', url: 'https://example.com/h2' },
        { title: 'h3', url: 'https://example.com/h3' },
        { title: 'h4', url: 'https://example.com/h4' },
        { title: 'h5', url: 'https://example.com/h5' },
        { title: 'h6', url: 'https://example.com/h6' },
        { title: 'h7', url: 'https://example.com/h7' },
      ],
    }
    render(<SentimentCard sentiment={many} loading={false} />)
    expect(screen.getByText('h5')).toBeInTheDocument()
    expect(screen.queryByText('h6')).not.toBeInTheDocument()
  })

  it('shows reasoning text', () => {
    render(<SentimentCard sentiment={BULLISH} loading={false} />)
    expect(screen.getByText(BULLISH.reasoning)).toBeInTheDocument()
  })

  it('shows key themes as tags', () => {
    render(<SentimentCard sentiment={BULLISH} loading={false} />)
    expect(screen.getByText('earnings beat')).toBeInTheDocument()
    expect(screen.getByText('analyst upgrades')).toBeInTheDocument()
  })

  it('renders gracefully with empty headlines', () => {
    render(<SentimentCard sentiment={NEUTRAL} loading={false} />)
    expect(screen.getByText(/neutral/i)).toBeInTheDocument()
  })

  it('shows failure message when failed is true and no sentiment', () => {
    render(<SentimentCard sentiment={null} loading={false} failed={true} />)
    expect(screen.getByText(/could not be completed/i)).toBeInTheDocument()
  })

  it('renders normally when failed is true but sentiment is present', () => {
    render(<SentimentCard sentiment={BULLISH} loading={false} failed={true} />)
    expect(screen.getByText(/bullish/i)).toBeInTheDocument()
    expect(screen.queryByText(/could not be completed/i)).not.toBeInTheDocument()
  })
})

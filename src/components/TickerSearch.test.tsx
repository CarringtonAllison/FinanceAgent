import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TickerSearch } from './TickerSearch'

describe('TickerSearch', () => {
  it('renders a text input', () => {
    render(<TickerSearch onAnalyze={vi.fn()} loading={false} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders an Analyze button', () => {
    render(<TickerSearch onAnalyze={vi.fn()} loading={false} />)
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument()
  })

  it('uppercases ticker input', async () => {
    render(<TickerSearch onAnalyze={vi.fn()} loading={false} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'aapl')
    expect(input).toHaveValue('AAPL')
  })

  it('calls onAnalyze with the ticker when button is clicked', async () => {
    const onAnalyze = vi.fn()
    render(<TickerSearch onAnalyze={onAnalyze} loading={false} />)
    await userEvent.type(screen.getByRole('textbox'), 'TSLA')
    await userEvent.click(screen.getByRole('button', { name: /analyze/i }))
    expect(onAnalyze).toHaveBeenCalledWith('TSLA')
  })

  it('disables button while loading', () => {
    render(<TickerSearch onAnalyze={vi.fn()} loading={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onAnalyze when ticker is empty', async () => {
    const onAnalyze = vi.fn()
    render(<TickerSearch onAnalyze={onAnalyze} loading={false} />)
    await userEvent.click(screen.getByRole('button', { name: /analyze/i }))
    expect(onAnalyze).not.toHaveBeenCalled()
  })

  it('trims whitespace before calling onAnalyze', async () => {
    const onAnalyze = vi.fn()
    render(<TickerSearch onAnalyze={onAnalyze} loading={false} />)
    await userEvent.type(screen.getByRole('textbox'), 'AAPL ')
    await userEvent.click(screen.getByRole('button', { name: /analyze/i }))
    expect(onAnalyze).toHaveBeenCalledWith('AAPL')
  })
})

describe('TickerSearch autocomplete', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mockFetch = (suggestions: { symbol: string; name: string }[]) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => suggestions,
      ok: true,
    }))
  }

  it('shows suggestions dropdown when typing', async () => {
    mockFetch([
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'AAPD', name: 'Direxion Daily AAPL Bear' },
    ])
    render(<TickerSearch onAnalyze={vi.fn()} loading={false} />)
    await userEvent.type(screen.getByRole('textbox'), 'AAP')
    expect(await screen.findByTestId('suggestions-dropdown')).toBeInTheDocument()
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
  })

  it('calls onAnalyze with the symbol when a suggestion is clicked', async () => {
    const onAnalyze = vi.fn()
    mockFetch([{ symbol: 'AAPL', name: 'Apple Inc.' }])
    render(<TickerSearch onAnalyze={onAnalyze} loading={false} />)
    await userEvent.type(screen.getByRole('textbox'), 'AAP')
    await userEvent.click(await screen.findByText('AAPL'))
    expect(onAnalyze).toHaveBeenCalledWith('AAPL')
  })

  it('hides dropdown after a suggestion is selected', async () => {
    mockFetch([{ symbol: 'AAPL', name: 'Apple Inc.' }])
    render(<TickerSearch onAnalyze={vi.fn()} loading={false} />)
    await userEvent.type(screen.getByRole('textbox'), 'AAP')
    await userEvent.click(await screen.findByText('AAPL'))
    expect(screen.queryByTestId('suggestions-dropdown')).not.toBeInTheDocument()
  })

  it('does not show dropdown when input is empty', async () => {
    mockFetch([])
    render(<TickerSearch onAnalyze={vi.fn()} loading={false} />)
    expect(screen.queryByTestId('suggestions-dropdown')).not.toBeInTheDocument()
  })
})

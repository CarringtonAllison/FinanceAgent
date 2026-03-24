import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

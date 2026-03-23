import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AgentProgressTracker } from './AgentProgressTracker'
import type { AgentState } from './AgentProgressTracker'

const AGENT_NAMES = ['market_data', 'technical_analysis', 'sentiment', 'recommendation']

function makeAgents(overrides: Record<string, Partial<AgentState>> = {}): Record<string, AgentState> {
  const base: Record<string, AgentState> = {}
  for (const name of AGENT_NAMES) {
    base[name] = { status: 'pending', result: null, ...overrides[name] }
  }
  return base
}

describe('AgentProgressTracker', () => {
  it('renders a card for each agent', () => {
    render(<AgentProgressTracker agents={makeAgents()} />)
    expect(screen.getByText(/market.data/i)).toBeInTheDocument()
    expect(screen.getByText(/technical.analysis/i)).toBeInTheDocument()
    expect(screen.getByText(/sentiment/i)).toBeInTheDocument()
    expect(screen.getByText(/recommendation/i)).toBeInTheDocument()
  })

  it('shows pending status label for pending agents', () => {
    render(<AgentProgressTracker agents={makeAgents()} />)
    const badges = screen.getAllByText(/pending/i)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('shows running status label for running agents', () => {
    render(<AgentProgressTracker agents={makeAgents({ market_data: { status: 'running', result: null } })} />)
    expect(screen.getByText(/running/i)).toBeInTheDocument()
  })

  it('shows complete status label for complete agents', () => {
    render(<AgentProgressTracker agents={makeAgents({ sentiment: { status: 'complete', result: {} } })} />)
    expect(screen.getByText(/complete/i)).toBeInTheDocument()
  })

  it('shows error status label for errored agents', () => {
    render(<AgentProgressTracker agents={makeAgents({ recommendation: { status: 'error', result: null } })} />)
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })

  it('renders nothing when agents object is empty', () => {
    const { container } = render(<AgentProgressTracker agents={{}} />)
    expect(container.firstChild).toBeEmptyDOMElement()
  })

  it('status badge includes transition class', () => {
    render(<AgentProgressTracker agents={makeAgents()} />)
    const badges = screen.getAllByText(/pending/i)
    expect(badges[0].className).toMatch(/transition/)
  })
})

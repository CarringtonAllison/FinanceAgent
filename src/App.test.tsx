import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the app title', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok', service: 'finance-agent' }), { status: 200 })
    )
    render(<App />)
    expect(screen.getByText('Finance Agent')).toBeInTheDocument()
  })

  it('shows connecting status initially', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
    render(<App />)
    expect(screen.getByText(/connecting/i)).toBeInTheDocument()
  })

  it('shows backend connected when health check succeeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok', service: 'finance-agent' }), { status: 200 })
    )
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/backend connected/i)).toBeInTheDocument()
    })
  })

  it('shows backend offline when health check fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/backend offline/i)).toBeInTheDocument()
    })
  })
})

import { useCallback, useEffect, useRef, useState } from 'react'
import { AgentProgressTracker } from './components/AgentProgressTracker'
import { ErrorBanner } from './components/ErrorBanner'
import type { AgentState } from './components/AgentProgressTracker'
import { PortfolioBar } from './components/PortfolioBar'
import { PositionsTable } from './components/PositionsTable'
import type { Position } from './components/PositionsTable'
import { PriceChart } from './components/PriceChart'
import { RecommendationCard } from './components/RecommendationCard'
import type { RecommendationResult } from './components/RecommendationCard'
import { SentimentCard } from './components/SentimentCard'
import type { SentimentResult } from './components/SentimentCard'
import { TickerSearch } from './components/TickerSearch'
import { TradeHistoryLog } from './components/TradeHistoryLog'
import type { Trade } from './components/TradeHistoryLog'
import { TradePanel } from './components/TradePanel'

type BackendStatus = 'connecting' | 'connected' | 'offline'

interface Bar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface PortfolioData {
  cash_balance: number
  total_value: number
  positions: Array<{
    ticker: string
    shares: number
    avg_cost: number
    current_price: number
    market_value: number
    unrealized_pnl: number
    unrealized_pnl_pct: number
  }>
  total_unrealized_pnl: number
}

const AGENT_ORDER = ['market_data', 'technical_analysis', 'sentiment', 'recommendation']

function makeInitialAgents(): Record<string, AgentState> {
  return Object.fromEntries(AGENT_ORDER.map((name) => [name, { status: 'pending', result: null }]))
}

export function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('connecting')
  const [ticker, setTicker] = useState<string>('')
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [agentProgress, setAgentProgress] = useState<Record<string, AgentState>>({})
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null)
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null)
  const [reportFilename, setReportFilename] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const fetchPortfolio = useCallback(async () => {
    setPortfolioLoading(true)
    try {
      const [portfolioRes, tradesRes] = await Promise.all([
        fetch('http://localhost:8000/portfolio'),
        fetch('http://localhost:8000/portfolio/trades'),
      ])
      const portfolioData = await portfolioRes.json() as PortfolioData
      const tradesData = await tradesRes.json() as { trades: Array<{ id: number; ticker: string; action: string; shares: number; price: number; total: number; created_at: string }> }
      setPortfolio(portfolioData)
      setTrades(tradesData.trades.map((t) => ({
        id: t.id,
        ticker: t.ticker,
        action: t.action as Trade['action'],
        shares: t.shares,
        price: t.price,
        total: t.total,
        createdAt: t.created_at,
      })))
    } finally {
      setPortfolioLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((res) => res.json())
      .then((data: { status: string }) => {
        setBackendStatus(data.status === 'ok' ? 'connected' : 'offline')
        if (data.status === 'ok') fetchPortfolio()
      })
      .catch(() => setBackendStatus('offline'))
  }, [fetchPortfolio])

  async function handleAnalyze(symbol: string) {
    eventSourceRef.current?.close()

    setLoading(true)
    setTicker(symbol)
    setStreamUrl(null)
    setSentiment(null)
    setRecommendation(null)
    setReportFilename(null)
    setAgentProgress(makeInitialAgents())

    try {
      const res = await fetch(`http://localhost:8000/market-data/${symbol}/bars`)
      if (!res.ok) {
        const err = await res.json() as { detail: string }
        setLoading(false)
        setTicker('')
        setErrorMessage(err.detail ?? `Could not load data for ${symbol}.`)
        return
      }
      const data = await res.json() as { ticker: string; bars: Bar[] }
      setBars(data.bars)
      setStreamUrl(`http://localhost:8000/market-data/${symbol}/stream`)
    } catch {
      setLoading(false)
      setErrorMessage('Could not reach the backend. Is it running?')
      return
    }

    const es = new EventSource(`http://localhost:8000/orchestrate/${symbol}/run`)
    eventSourceRef.current = es

    es.onmessage = (event: MessageEvent) => {
      const payload = JSON.parse(event.data as string) as {
        agent: string
        status: string
        result: unknown
        report?: string
      }

      if (payload.agent === 'done') {
        es.close()
        setLoading(false)
        if (payload.report) setReportFilename(payload.report)
        return
      }

      setAgentProgress((prev) => ({
        ...prev,
        [payload.agent]: { status: payload.status as AgentState['status'], result: payload.result },
      }))

      if (payload.agent === 'sentiment' && payload.status === 'complete') {
        setSentiment(payload.result as SentimentResult)
      }
      if (payload.agent === 'recommendation' && payload.status === 'complete') {
        setRecommendation(payload.result as RecommendationResult)
      }
    }

    es.onerror = () => {
      es.close()
      setLoading(false)
      setErrorMessage('Analysis stream failed. Please try again.')
    }
  }

  const statusConfig = {
    connecting: { label: 'Connecting...', classes: 'text-yellow-400 border-yellow-400/25 bg-yellow-400/10' },
    connected:  { label: 'Backend Connected', classes: 'text-green-400 border-green-400/25 bg-green-400/10' },
    offline:    { label: 'Backend Offline', classes: 'text-red-400 border-red-400/25 bg-red-400/10' },
  }

  const { label, classes } = statusConfig[backendStatus]

  const mappedPositions: Position[] = (portfolio?.positions ?? []).map((p) => ({
    ticker: p.ticker,
    shares: p.shares,
    avgCost: p.avg_cost,
    currentPrice: p.current_price,
    marketValue: p.market_value,
    unrealizedPnl: p.unrealized_pnl,
    unrealizedPnlPct: p.unrealized_pnl_pct,
  }))

  return (
    <div className="min-h-screen flex flex-col items-center gap-8 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 w-full max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Finance Agent</h1>
        <span className={`text-xs font-semibold tracking-widest border px-3 py-1 rounded-full ${classes}`}>
          {label}
        </span>
      </div>

      {errorMessage && (
        <div className="w-full max-w-4xl">
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        </div>
      )}

      <div className="w-full max-w-4xl">
        <PortfolioBar
          cashBalance={portfolio?.cash_balance ?? 0}
          totalValue={portfolio?.total_value ?? 0}
          totalUnrealizedPnl={portfolio?.total_unrealized_pnl ?? 0}
          loading={portfolioLoading}
        />
      </div>

      <TickerSearch onAnalyze={handleAnalyze} loading={loading} />

      <div className="w-full max-w-4xl">
        <PriceChart bars={bars} ticker={ticker || null} streamUrl={streamUrl} />
      </div>

      {ticker && (
        <div className="w-full max-w-4xl flex flex-col gap-6">
          {Object.keys(agentProgress).length > 0 && (
            <AgentProgressTracker agents={agentProgress} />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SentimentCard sentiment={sentiment} loading={loading && sentiment === null} />
            <RecommendationCard recommendation={recommendation} loading={loading && recommendation === null} />
          </div>

          <TradePanel ticker={ticker} onTradeExecuted={fetchPortfolio} />

          {reportFilename && (
            <a
              href={`http://localhost:8000/orchestrate/reports/${reportFilename}`}
              download={reportFilename}
              className="self-start rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Download Report ({reportFilename})
            </a>
          )}
        </div>
      )}

      <div className="w-full max-w-4xl flex flex-col gap-4">
        <PositionsTable positions={mappedPositions} loading={portfolioLoading} />
        <TradeHistoryLog trades={trades} loading={portfolioLoading} />
      </div>
    </div>
  )
}

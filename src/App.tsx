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

const QUOTES = [
  { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "The four most dangerous words in investing: 'This time it's different.'", author: "Sir John Templeton" },
  { text: "The market can stay irrational longer than you can stay solvent.", author: "John Maynard Keynes" },
  { text: "In investing, what is comfortable is rarely profitable.", author: "Robert Arnott" },
  { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "October: one of the peculiarly dangerous months to speculate in stocks.", author: "Mark Twain" },
  { text: "The best investment you can make is in yourself.", author: "Warren Buffett" },
]

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
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [quoteVisible, setQuoteVisible] = useState(true)
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    const cycle = setInterval(() => {
      setQuoteVisible(false)
      setTimeout(() => {
        setQuoteIndex((i) => (i + 1) % QUOTES.length)
        setQuoteVisible(true)
      }, 500)
    }, 8000)
    return () => clearInterval(cycle)
  }, [])

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
      setErrorMessage(`Could not connect to the backend while fetching data for ${symbol}. Make sure the server is running.`)
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
        if (payload.status === 'error') {
          const errResult = payload.result as { error?: string } | null
          setErrorMessage(errResult?.error ?? 'The analysis pipeline encountered an unexpected error.')
        } else if (payload.report) {
          setReportFilename(payload.report as string)
        }
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
      setErrorMessage(`Lost connection to the analysis stream for ${symbol}. Check that the backend is still running and try again.`)
    }
  }

  const statusConfig = {
    connecting: { label: 'Connecting...' },
    connected:  { label: 'Backend Connected' },
    offline:    { label: 'Backend Offline' },
  }

  const { label } = statusConfig[backendStatus]

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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1AAA89]/30 bg-[#0d1f1a]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-4 px-3 sm:px-6 py-3">
          {/* Logo + title */}
          <div className="flex items-center gap-3 shrink-0">
            <svg className="w-6 h-6 text-[#1AAA89] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-100 leading-none">Finance Agent</h1>
              <p className="text-xs text-slate-500 mt-0.5">AI-Powered Paper Trading</p>
            </div>
          </div>

          {/* Rotating quote — hidden on small screens */}
          <div className="flex-1 hidden sm:flex justify-center px-4 overflow-hidden">
            <p
              className="text-xs text-center italic transition-opacity duration-500 max-w-xl"
              style={{ opacity: quoteVisible ? 1 : 0 }}
            >
              <span className="text-slate-400">"{QUOTES[quoteIndex].text}"</span>
              <span className="text-[#6EC5A2] ml-1.5 not-italic">— {QUOTES[quoteIndex].author}</span>
            </p>
          </div>

          {/* Live clock */}
          <div className="shrink-0 text-right">
            <p className="text-sm font-mono font-semibold text-slate-200 tabular-nums">
              {clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4 sm:p-6 flex-1">
        {errorMessage && (
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        )}

        {/* Three-column body */}
        <div className="flex flex-col xl:flex-row gap-4 items-start">

          {/* Left pane — wallet & portfolio */}
          <div className="w-full xl:w-64 shrink-0 flex flex-col gap-3">
            <div className="rounded-xl border border-[#1AAA89]/25 bg-[#0d1f1a] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#1AAA89]/10 border-b border-[#1AAA89]/20">
                <span className="text-xs font-semibold text-[#6EC5A2] uppercase tracking-widest">Wallet</span>
              </div>
              <div className="p-3">
                <PortfolioBar
                  cashBalance={portfolio?.cash_balance ?? 0}
                  totalValue={portfolio?.total_value ?? 0}
                  totalUnrealizedPnl={portfolio?.total_unrealized_pnl ?? 0}
                  loading={portfolioLoading}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#1AAA89]/25 bg-[#0d1f1a] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#1AAA89]/10 border-b border-[#1AAA89]/20">
                <span className="text-xs font-semibold text-[#6EC5A2] uppercase tracking-widest">Holdings</span>
              </div>
              <div className="p-3 max-h-[320px] overflow-y-auto scrollbar-hide">
                <PositionsTable positions={mappedPositions} loading={portfolioLoading} />
              </div>
            </div>
          </div>

          {/* Middle pane — search & chart */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Search + agent progress — unified card */}
            <div className="rounded-xl border border-[#1AAA89]/25 bg-[#0d1f1a]">
              <div className="p-4 flex justify-center">
                <TickerSearch onAnalyze={handleAnalyze} loading={loading} />
              </div>
              {ticker && Object.keys(agentProgress).length > 0 && (
                <div className="border-t border-[#1AAA89]/20">
                  <AgentProgressTracker agents={agentProgress} />
                </div>
              )}
            </div>

            {/* Price chart */}
            <PriceChart bars={bars} ticker={ticker || null} streamUrl={streamUrl} />
          </div>

          {/* Right pane — execute trade & history */}
          <div className="w-full xl:w-72 shrink-0 flex flex-col gap-3">
            <div className="rounded-xl border border-[#1AAA89]/25 bg-[#0d1f1a] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#1AAA89]/10 border-b border-[#1AAA89]/20">
                <span className="text-xs font-semibold text-[#6EC5A2] uppercase tracking-widest">Execute Trade</span>
              </div>
              <div className="p-4">
                <TradePanel ticker={ticker} onTradeExecuted={fetchPortfolio} />
              </div>
            </div>

            <div className="rounded-xl border border-[#1AAA89]/25 bg-[#0d1f1a] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#1AAA89]/10 border-b border-[#1AAA89]/20">
                <span className="text-xs font-semibold text-[#6EC5A2] uppercase tracking-widest">Trade History</span>
              </div>
              <div className="p-3 max-h-[320px] overflow-y-auto scrollbar-hide">
                <TradeHistoryLog trades={trades} loading={portfolioLoading} />
              </div>
            </div>
          </div>

        </div>

        {/* AI Analysis — full width below all panes */}
        {ticker && (
          <div className="rounded-xl border border-[#1AAA89]/25 overflow-hidden">
            <div className="px-5 py-2.5 bg-[#1AAA89]/10 border-b border-[#1AAA89]/20">
              <span className="text-xs font-semibold text-[#6EC5A2] uppercase tracking-widest">AI Analysis</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1AAA89]/20">
              <div className="p-5">
                <SentimentCard sentiment={sentiment} loading={loading && sentiment === null} />
              </div>
              <div className="p-5">
                <RecommendationCard recommendation={recommendation} loading={loading && recommendation === null} />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer — backend status + report download */}
      <footer className="border-t border-[#1AAA89]/20 px-3 sm:px-6 py-2 flex items-center gap-4">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          backendStatus === 'connected' ? 'bg-[#1AAA89]' :
          backendStatus === 'connecting' ? 'bg-[#F7E460] animate-pulse' :
          'bg-[#F4532B]'
        }`} />
        <span className="text-xs text-slate-500">{label}</span>
        {reportFilename && (
          <a
            href={`http://localhost:8000/orchestrate/reports/${reportFilename}`}
            download={reportFilename}
            className="ml-auto text-xs text-[#6EC5A2] hover:text-[#1AAA89] transition-colors"
          >
            ↓ Download Report ({reportFilename})
          </a>
        )}
      </footer>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { AgentProgressTracker } from './components/AgentProgressTracker'
import type { AgentState } from './components/AgentProgressTracker'
import { PriceChart } from './components/PriceChart'
import { RecommendationCard } from './components/RecommendationCard'
import type { RecommendationResult } from './components/RecommendationCard'
import { SentimentCard } from './components/SentimentCard'
import type { SentimentResult } from './components/SentimentCard'
import { TickerSearch } from './components/TickerSearch'

type BackendStatus = 'connecting' | 'connected' | 'offline'

interface Bar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
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
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((res) => res.json())
      .then((data: { status: string }) => {
        setBackendStatus(data.status === 'ok' ? 'connected' : 'offline')
      })
      .catch(() => setBackendStatus('offline'))
  }, [])

  async function handleAnalyze(symbol: string) {
    // Close any previous SSE connection
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
      const data = await res.json() as { ticker: string; bars: Bar[] }
      setBars(data.bars)
      setStreamUrl(`http://localhost:8000/market-data/${symbol}/stream`)
    } catch {
      setLoading(false)
      return
    }

    // Open SSE stream for agent orchestration
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
    }
  }

  const statusConfig = {
    connecting: { label: 'Connecting...', classes: 'text-yellow-400 border-yellow-400/25 bg-yellow-400/10' },
    connected:  { label: 'Backend Connected', classes: 'text-green-400 border-green-400/25 bg-green-400/10' },
    offline:    { label: 'Backend Offline', classes: 'text-red-400 border-red-400/25 bg-red-400/10' },
  }

  const { label, classes } = statusConfig[backendStatus]

  return (
    <div className="min-h-screen flex flex-col items-center gap-8 p-8">
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Finance Agent</h1>
        <span className={`text-xs font-semibold tracking-widest border px-3 py-1 rounded-full ${classes}`}>
          {label}
        </span>
      </div>

      <TickerSearch onAnalyze={handleAnalyze} loading={loading} />

      {!ticker && (
        <p className="text-slate-600 text-sm mt-4">Enter a ticker symbol above to begin analysis.</p>
      )}

      {ticker && (
        <div className="w-full max-w-4xl flex flex-col gap-6">
          <PriceChart bars={bars} ticker={ticker} streamUrl={streamUrl} />

          {Object.keys(agentProgress).length > 0 && (
            <AgentProgressTracker agents={agentProgress} />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SentimentCard sentiment={sentiment} loading={loading && sentiment === null} />
            <RecommendationCard recommendation={recommendation} loading={loading && recommendation === null} />
          </div>

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
    </div>
  )
}

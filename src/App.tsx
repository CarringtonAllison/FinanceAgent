import { useEffect, useState } from 'react'
import { PriceChart } from './components/PriceChart'
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

export function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('connecting')
  const [ticker, setTicker] = useState<string>('')
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((res) => res.json())
      .then((data: { status: string }) => {
        setBackendStatus(data.status === 'ok' ? 'connected' : 'offline')
      })
      .catch(() => setBackendStatus('offline'))
  }, [])

  async function handleAnalyze(symbol: string) {
    setLoading(true)
    setTicker(symbol)
    setStreamUrl(null)
    try {
      const res = await fetch(`http://localhost:8000/market-data/${symbol}/bars`)
      const data = await res.json() as { ticker: string; bars: Bar[] }
      setBars(data.bars)
      setStreamUrl(`http://localhost:8000/market-data/${symbol}/stream`)
    } finally {
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

      {ticker && (
        <div className="w-full max-w-4xl">
          <PriceChart bars={bars} ticker={ticker} streamUrl={streamUrl} />
        </div>
      )}

      {!ticker && (
        <p className="text-slate-600 text-sm mt-4">Enter a ticker symbol above to begin analysis.</p>
      )}
    </div>
  )
}

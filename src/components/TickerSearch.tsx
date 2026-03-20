import { useState } from 'react'

interface TickerSearchProps {
  onAnalyze: (ticker: string) => void
  loading: boolean
}

export function TickerSearch({ onAnalyze, loading }: TickerSearchProps) {
  const [ticker, setTicker] = useState('')

  function handleSubmit() {
    if (!ticker.trim()) return
    onAnalyze(ticker)
  }

  return (
    <div className="flex gap-3 w-full max-w-md">
      <input
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="AAPL"
        className="flex-1 bg-gray-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 uppercase tracking-widest font-mono"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg transition-colors"
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </div>
  )
}

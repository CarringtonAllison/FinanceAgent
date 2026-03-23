import { useState } from 'react'

interface TradePanelProps {
  ticker: string
  onTradeExecuted: () => void
}

export function TradePanel({ ticker, onTradeExecuted }: TradePanelProps) {
  const [inputTicker, setInputTicker] = useState(ticker)
  const [shares, setShares] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(selectedAction: 'BUY' | 'SELL') {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('http://localhost:8000/portfolio/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: inputTicker.toUpperCase(), action: selectedAction, shares }),
      })
      if (!res.ok) {
        const data = await res.json() as { detail: string }
        setError(data.detail)
        return
      }
      onTradeExecuted()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-4">
      <h3 className="font-semibold text-slate-800">Trade</h3>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Ticker</label>
        <input
          type="text"
          value={inputTicker}
          onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Shares</label>
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={shares}
          onChange={(e) => setShares(parseFloat(e.target.value) || 0)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-500"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleSubmit('BUY')}
          disabled={submitting}
          className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          BUY
        </button>
        <button
          onClick={() => handleSubmit('SELL')}
          disabled={submitting}
          className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          SELL
        </button>
      </div>
    </div>
  )
}

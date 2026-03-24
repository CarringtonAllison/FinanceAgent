import { useEffect, useState } from 'react'

interface TradePanelProps {
  ticker: string
  onTradeExecuted: () => void
}

export function TradePanel({ ticker, onTradeExecuted }: TradePanelProps) {
  const [inputTicker, setInputTicker] = useState(ticker)
  const [shares, setShares] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInputTicker(ticker)
  }, [ticker])

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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#6EC5A2]/70">Ticker</label>
          <input
            type="text"
            value={inputTicker}
            onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
            className="rounded-lg border border-[#1AAA89]/30 bg-[#162820] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1AAA89] font-mono tracking-widest"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#6EC5A2]/70">Shares</label>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={shares}
            onChange={(e) => setShares(parseFloat(e.target.value) || 0)}
            className="rounded-lg border border-[#1AAA89]/30 bg-[#162820] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1AAA89]"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit('BUY')}
          disabled={submitting}
          className="flex-1 rounded-lg bg-[#1AAA89] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#22C49C] disabled:opacity-50 transition-colors"
        >
          BUY
        </button>
        <button
          onClick={() => handleSubmit('SELL')}
          disabled={submitting}
          className="flex-1 rounded-lg bg-[#F4532B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#F7704D] disabled:opacity-50 transition-colors"
        >
          SELL
        </button>
      </div>
    </div>
  )
}

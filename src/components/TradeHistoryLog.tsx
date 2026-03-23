export interface Trade {
  id: number
  ticker: string
  action: 'BUY' | 'SELL'
  shares: number
  price: number
  total: number
  createdAt: string
}

interface TradeHistoryLogProps {
  trades: Trade[]
  loading: boolean
}

const ACTION_STYLES: Record<Trade['action'], string> = {
  BUY: 'bg-green-100 text-green-700',
  SELL: 'bg-red-100 text-red-700',
}

function fmt(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

export function TradeHistoryLog({ trades, loading }: TradeHistoryLogProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500 animate-pulse">Loading trade history…</p>
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">No trades yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 max-h-64 overflow-y-auto">
      <h3 className="font-semibold text-slate-800 text-sm">Trade History</h3>
      {trades.map((trade) => (
        <div key={trade.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_STYLES[trade.action]}`}>
              {trade.action}
            </span>
            <span className="text-sm font-semibold text-slate-800">{trade.ticker}</span>
            <span className="text-xs text-slate-500">{trade.shares} @ {fmt(trade.price)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">{fmt(trade.total)}</span>
            <span className="text-xs text-slate-400">
              {new Date(trade.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

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
  BUY:  'bg-[#1AAA89]/20 text-[#1AAA89]',
  SELL: 'bg-[#F4532B]/20 text-[#F4532B]',
}

function fmt(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function TradeHistoryLog({ trades, loading }: TradeHistoryLogProps) {
  if (loading) {
    return <p className="text-sm text-slate-500 animate-pulse">Loading trade history…</p>
  }

  if (trades.length === 0) {
    return <p className="text-sm text-slate-500">No trades yet.</p>
  }

  return (
    <div className="overflow-hidden">
      <div>
        {trades.map((trade) => (
          <div key={trade.id} className="py-3 border-b border-slate-700/50 last:border-0">
            {/* Row 1: badge + ticker + total */}
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${ACTION_STYLES[trade.action]}`}>
                {trade.action}
              </span>
              <span className="text-sm font-semibold text-slate-100 flex-1">{trade.ticker}</span>
              <span className="text-sm font-medium text-slate-300">{fmt(trade.total)}</span>
            </div>
            {/* Row 2: shares@price + date */}
            <div className="flex items-center justify-between mt-1 pl-9">
              <span className="text-xs text-slate-500">{trade.shares} @ {fmt(trade.price)}</span>
              <span className="text-xs text-slate-600">{fmtDate(trade.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

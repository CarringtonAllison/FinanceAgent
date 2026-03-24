export interface Position {
  ticker: string
  shares: number
  avgCost: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  unrealizedPnlPct: number
}

interface PositionsTableProps {
  positions: Position[]
  loading: boolean
}

function fmt(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

function pnlColor(pnl: number): string {
  if (pnl > 0) return 'text-green-400'
  if (pnl < 0) return 'text-red-400'
  return 'text-slate-500'
}

export function PositionsTable({ positions, loading }: PositionsTableProps) {
  if (loading) {
    return <p className="text-sm text-slate-500 animate-pulse">Loading positions…</p>
  }

  if (positions.length === 0) {
    return <p className="text-sm text-slate-500">No open positions.</p>
  }

  return (
    <div className="overflow-hidden">
      {/* Column headers — each label appears once */}
      <div className="grid grid-cols-3 pb-2 mb-1 border-b border-slate-700/50">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ticker</span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Shares</span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Avg Cost</span>
      </div>

      {positions.map((pos) => (
        <div key={pos.ticker} className="py-3 border-b border-slate-700/50 last:border-0">
          {/* Row 1: ticker + shares + avg cost */}
          <div className="grid grid-cols-3 mb-2">
            <span className="font-bold text-slate-100">{pos.ticker}</span>
            <span className="text-sm text-slate-400 text-center">{pos.shares}</span>
            <span className="text-xs text-slate-500 text-right">{fmt(pos.avgCost)}</span>
          </div>
          {/* Row 2: P&L + current price + P&L% */}
          <div className="flex items-center justify-between">
            <span
              data-testid={`pnl-${pos.ticker}`}
              className={`text-sm font-semibold ${pnlColor(pos.unrealizedPnl)}`}
            >
              {pos.unrealizedPnl >= 0 ? '+' : ''}{fmt(pos.unrealizedPnl)}
            </span>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400">{fmt(pos.currentPrice)}</span>
              <span className={`text-xs font-medium ${pnlColor(pos.unrealizedPnlPct)}`}>
                {pos.unrealizedPnlPct >= 0 ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

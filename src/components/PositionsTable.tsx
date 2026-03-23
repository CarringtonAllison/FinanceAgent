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
  if (pnl > 0) return 'text-green-600'
  if (pnl < 0) return 'text-red-600'
  return 'text-slate-500'
}

export function PositionsTable({ positions, loading }: PositionsTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500 animate-pulse">Loading positions…</p>
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">No open positions.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            {['Ticker', 'Shares', 'Avg Cost', 'Current Price', 'Market Value', 'Unrealized P&L', 'P&L %'].map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr key={pos.ticker} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-2 font-semibold text-slate-800">{pos.ticker}</td>
              <td className="px-4 py-2 text-slate-600">{pos.shares}</td>
              <td className="px-4 py-2 text-slate-600">{fmt(pos.avgCost)}</td>
              <td className="px-4 py-2 text-slate-600">{fmt(pos.currentPrice)}</td>
              <td className="px-4 py-2 text-slate-600">{fmt(pos.marketValue)}</td>
              <td data-testid={`pnl-${pos.ticker}`} className={`px-4 py-2 font-medium ${pnlColor(pos.unrealizedPnl)}`}>
                {pos.unrealizedPnl >= 0 ? '+' : ''}{fmt(pos.unrealizedPnl)}
              </td>
              <td className={`px-4 py-2 font-medium ${pnlColor(pos.unrealizedPnlPct)}`}>
                {pos.unrealizedPnlPct >= 0 ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

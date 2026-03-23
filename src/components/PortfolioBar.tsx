interface PortfolioBarProps {
  cashBalance: number
  totalValue: number
  totalUnrealizedPnl: number
  loading: boolean
}

function fmt(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

function pnlColor(pnl: number): string {
  if (pnl > 0) return 'text-green-400'
  if (pnl < 0) return 'text-red-400'
  return 'text-slate-400'
}

export function PortfolioBar({ cashBalance, totalValue, totalUnrealizedPnl, loading }: PortfolioBarProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-3">
        <span className="text-sm text-slate-500 animate-pulse">Loading portfolio…</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-8 rounded-lg border border-slate-700 bg-slate-800 px-6 py-3">
      <div className="flex flex-col">
        <span className="text-xs text-slate-500">Cash</span>
        <span className="text-sm font-semibold text-slate-100">{fmt(cashBalance)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-slate-500">Total Value</span>
        <span className="text-sm font-semibold text-slate-100">{fmt(totalValue)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-slate-500">Unrealized P&amp;L</span>
        <span data-testid="pnl" className={`text-sm font-semibold ${pnlColor(totalUnrealizedPnl)}`}>
          {totalUnrealizedPnl >= 0 ? '+' : ''}{fmt(totalUnrealizedPnl)}
        </span>
      </div>
    </div>
  )
}

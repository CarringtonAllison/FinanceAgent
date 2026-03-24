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
      <div data-testid="portfolio-skeleton" className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="h-3 w-16 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-700" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
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

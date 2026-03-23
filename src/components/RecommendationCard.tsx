export interface RecommendationResult {
  action: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reasoning: string
}

interface RecommendationCardProps {
  recommendation: RecommendationResult | null
  loading: boolean
}

const ACTION_STYLES: Record<RecommendationResult['action'], string> = {
  BUY: 'text-green-600',
  SELL: 'text-red-600',
  HOLD: 'text-yellow-600',
}

const BAR_STYLES: Record<RecommendationResult['action'], string> = {
  BUY: 'bg-green-500',
  SELL: 'bg-red-500',
  HOLD: 'bg-yellow-500',
}

export function RecommendationCard({ recommendation, loading }: RecommendationCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500 animate-pulse">Generating recommendation…</p>
      </div>
    )
  }

  if (!recommendation) return <div></div>

  const confidencePct = Math.round(recommendation.confidence * 100)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Recommendation</h3>
        <span className={`text-2xl font-bold ${ACTION_STYLES[recommendation.action]}`}>
          {recommendation.action}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Confidence</span>
          <span>{confidencePct}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={confidencePct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full rounded-full bg-slate-100"
        >
          <div
            className={`h-2 rounded-full ${BAR_STYLES[recommendation.action]}`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-slate-700">{recommendation.reasoning}</p>
    </div>
  )
}

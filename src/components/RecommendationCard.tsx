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
  BUY:  'text-green-400',
  SELL: 'text-red-400',
  HOLD: 'text-yellow-400',
}

const BAR_STYLES: Record<RecommendationResult['action'], string> = {
  BUY:  'bg-green-500',
  SELL: 'bg-red-500',
  HOLD: 'bg-yellow-500',
}

export function RecommendationCard({ recommendation, loading }: RecommendationCardProps) {
  if (loading) {
    return <p className="text-sm text-slate-500 animate-pulse">Generating recommendation…</p>
  }

  if (!recommendation) return <div></div>

  const confidencePct = Math.round(recommendation.confidence * 100)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Recommendation</h3>
        <span className={`text-2xl font-bold ${ACTION_STYLES[recommendation.action]}`}>
          {recommendation.action}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Confidence</span>
          <span>{confidencePct}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={confidencePct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 w-full rounded-full bg-slate-700"
        >
          <div
            className={`h-1.5 rounded-full ${BAR_STYLES[recommendation.action]}`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-slate-300">{recommendation.reasoning}</p>
    </div>
  )
}

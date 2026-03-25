export interface RecommendationResult {
  action: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reasoning: string
  key_factors: string[]
  risk_level: 'low' | 'medium' | 'high'
  time_horizon: 'short' | 'medium' | 'long'
  entry_price: number | null
  stop_loss: number | null
  target_price: number | null
}

interface RecommendationCardProps {
  recommendation: RecommendationResult | null
  loading: boolean
}

const ACTION_STYLES: Record<RecommendationResult['action'], string> = {
  BUY:  'text-[#6EC5A2]',
  SELL: 'text-[#F4532B]',
  HOLD: 'text-[#F7E460]',
}

const BAR_STYLES: Record<RecommendationResult['action'], string> = {
  BUY:  'bg-[#6EC5A2]',
  SELL: 'bg-[#F4532B]',
  HOLD: 'bg-[#F7E460]',
}

const RISK_STYLES: Record<RecommendationResult['risk_level'], string> = {
  low:    'text-[#6EC5A2]',
  medium: 'text-[#F7E460]',
  high:   'text-[#F4532B]',
}

const HORIZON_LABEL: Record<RecommendationResult['time_horizon'], string> = {
  short:  'Short-term',
  medium: 'Medium-term',
  long:   'Long-term',
}

function PriceRow({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-200">${value.toFixed(2)}</span>
    </div>
  )
}

export function RecommendationCard({ recommendation, loading }: RecommendationCardProps) {
  if (loading) {
    return <p className="text-sm text-slate-500 animate-pulse">Generating recommendation…</p>
  }

  if (!recommendation) return <div></div>

  const confidencePct = Math.round(recommendation.confidence * 100)
  const hasPriceLevels =
    recommendation.entry_price !== null ||
    recommendation.stop_loss !== null ||
    recommendation.target_price !== null

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

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Risk</span>
          <span className={`font-semibold capitalize ${RISK_STYLES[recommendation.risk_level]}`}>
            {recommendation.risk_level}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Horizon</span>
          <span className="font-semibold text-slate-300">{HORIZON_LABEL[recommendation.time_horizon]}</span>
        </div>
      </div>

      <p className="text-sm text-slate-300">{recommendation.reasoning}</p>

      {recommendation.key_factors.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Key Factors</p>
          <ul className="flex flex-col gap-0.5">
            {recommendation.key_factors.map((factor, i) => (
              <li key={i} className="flex items-start gap-1 text-xs text-slate-400">
                <span aria-hidden="true" className="mt-0.5 shrink-0 text-slate-600">·</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasPriceLevels && (
        <div className="flex flex-col gap-1 rounded-md bg-slate-800 p-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Price Levels</p>
          <PriceRow label="Entry" value={recommendation.entry_price} />
          <PriceRow label="Stop Loss" value={recommendation.stop_loss} />
          <PriceRow label="Target" value={recommendation.target_price} />
        </div>
      )}
    </div>
  )
}

export interface SentimentResult {
  score: 'bullish' | 'neutral' | 'bearish'
  confidence: number
  headlines: string[]
  reasoning: string
}

interface SentimentCardProps {
  sentiment: SentimentResult | null
  loading: boolean
}

const SCORE_STYLES: Record<SentimentResult['score'], string> = {
  bullish: 'bg-green-100 text-green-700',
  neutral: 'bg-yellow-100 text-yellow-700',
  bearish: 'bg-red-100 text-red-700',
}

export function SentimentCard({ sentiment, loading }: SentimentCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500 animate-pulse">Analyzing sentiment…</p>
      </div>
    )
  }

  if (!sentiment) return <div></div>

  const visibleHeadlines = sentiment.headlines.slice(0, 5)
  const confidencePct = Math.round(sentiment.confidence * 100)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Sentiment</h3>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SCORE_STYLES[sentiment.score]}`}>
            {sentiment.score}
          </span>
          <span className="text-sm text-slate-500">{confidencePct}%</span>
        </div>
      </div>

      {visibleHeadlines.length > 0 && (
        <ul className="flex flex-col gap-1">
          {visibleHeadlines.map((headline, i) => (
            <li key={i} className="text-xs text-slate-600 truncate">
              {headline}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-slate-700">{sentiment.reasoning}</p>
    </div>
  )
}

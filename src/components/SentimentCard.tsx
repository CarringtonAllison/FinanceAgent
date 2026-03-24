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
  bullish: 'bg-[#6EC5A2]/20 text-[#6EC5A2]',
  neutral: 'bg-[#F7E460]/20 text-[#F7E460]',
  bearish: 'bg-[#F4532B]/20 text-[#F4532B]',
}

export function SentimentCard({ sentiment, loading }: SentimentCardProps) {
  if (loading) {
    return <p className="text-sm text-slate-500 animate-pulse">Analyzing sentiment…</p>
  }

  if (!sentiment) return <div></div>

  const visibleHeadlines = sentiment.headlines.slice(0, 5)
  const confidencePct = Math.round(sentiment.confidence * 100)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Sentiment</h3>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SCORE_STYLES[sentiment.score]}`}>
            {sentiment.score}
          </span>
          <span className="text-sm text-slate-400">{confidencePct}%</span>
        </div>
      </div>

      {visibleHeadlines.length > 0 && (
        <ul className="flex flex-col gap-1">
          {visibleHeadlines.map((headline, i) => (
            <li key={i} className="flex items-center gap-1 text-xs text-slate-500 truncate">
              <span aria-hidden="true">·</span>
              <span>{headline}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-slate-300">{sentiment.reasoning}</p>
    </div>
  )
}

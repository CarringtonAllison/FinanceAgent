export interface SentimentHeadline {
  title: string
  url: string
}

export interface SentimentResult {
  score: 'bullish' | 'neutral' | 'bearish'
  confidence: number
  headlines: SentimentHeadline[]
  key_themes: string[]
  reasoning: string
}

interface SentimentCardProps {
  sentiment: SentimentResult | null
  loading: boolean
  failed?: boolean
}

const SCORE_STYLES: Record<SentimentResult['score'], string> = {
  bullish: 'bg-[#6EC5A2]/20 text-[#6EC5A2]',
  neutral: 'bg-[#F7E460]/20 text-[#F7E460]',
  bearish: 'bg-[#F4532B]/20 text-[#F4532B]',
}

export function SentimentCard({ sentiment, loading, failed }: SentimentCardProps) {
  if (loading) {
    return <p className="text-sm text-slate-500 animate-pulse">Analyzing sentiment…</p>
  }

  if (!sentiment) {
    if (failed) {
      return (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-slate-100">Sentiment</h3>
          <p className="text-sm text-[#F7E460]">
            Sentiment analysis could not be completed for this run. The recommendation below may be based on limited information.
          </p>
        </div>
      )
    }
    return <div></div>
  }

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

      <p className="text-sm text-slate-300">{sentiment.reasoning}</p>

      {sentiment.key_themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sentiment.key_themes.map((theme, i) => (
            <span key={i} className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
              {theme}
            </span>
          ))}
        </div>
      )}

      {visibleHeadlines.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sources</p>
          <ul className="flex flex-col gap-1">
            {visibleHeadlines.map((headline, i) => (
              <li key={i} className="flex items-start gap-1 text-xs">
                <span aria-hidden="true" className="mt-0.5 shrink-0 text-slate-600">·</span>
                <a
                  href={headline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors line-clamp-2"
                >
                  {headline.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

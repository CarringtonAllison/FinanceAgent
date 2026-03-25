import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  ColorType,
} from 'lightweight-charts'

interface Bar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface PriceChartProps {
  bars: Bar[]
  ticker: string | null
  streamUrl: string | null
}

function fmt(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

export function PriceChart({ bars, ticker, streamUrl }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const rafRef = useRef<number | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceUp, setPriceUp] = useState<boolean>(true)

  // Create (or recreate) the chart each time ticker is set — this ensures the
  // container is in the DOM and has its real width when createChart is called.
  useEffect(() => {
    if (!ticker || !containerRef.current) return

    setCurrentPrice(null)

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1f1a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 320,
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#6EC5A2',
      downColor: '#F4532B',
      borderUpColor: '#6EC5A2',
      borderDownColor: '#F4532B',
      wickUpColor: '#6EC5A2',
      wickDownColor: '#F4532B',
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [ticker])

  // Update series data when bars change, then zoom into current time over 2s
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || bars.length === 0) return

    const data: CandlestickData<Time>[] = bars.map((b) => ({
      time: b.time as Time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }))
    seriesRef.current.setData(data)

    const lastBar = bars[bars.length - 1]
    setCurrentPrice(lastBar.close)
    setPriceUp(lastBar.close >= lastBar.open)

    // Cancel any in-progress animation from a previous load
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    const total = data.length
    const targetFrom = Math.max(0, total - 20)
    const duration = 2000
    const startTs = performance.now()

    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    const animate = (now: number) => {
      const t = Math.min((now - startTs) / duration, 1)
      const from = easeInOut(t) * targetFrom
      chartRef.current?.timeScale().setVisibleLogicalRange({ from, to: total - 1 })
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [bars])

  // Subscribe to SSE stream for real-time updates
  useEffect(() => {
    if (!streamUrl || !seriesRef.current) return

    const es = new EventSource(streamUrl)
    eventSourceRef.current = es

    es.onmessage = (event: MessageEvent) => {
      const bar = JSON.parse(event.data as string) as Bar
      seriesRef.current?.update({
        time: bar.time as Time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })
      setCurrentPrice(bar.close)
      setPriceUp(bar.close >= bar.open)
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [streamUrl])

  if (!ticker) {
    return (
      <div
        data-testid="price-chart-placeholder"
        className="flex h-[320px] w-full items-center justify-center rounded-xl border border-[#1AAA89]/25 bg-[#0d1f1a]"
      >
        <p className="text-sm text-slate-500">Enter a ticker symbol to view the chart.</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#0d1f1a] border border-[#1AAA89]/25 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-100 font-bold text-lg font-mono">{ticker}</span>
          <span className="text-xs text-slate-500">1 Min</span>
        </div>
        {currentPrice !== null && (
          <div className="flex items-center gap-1.5">
            <span className={`text-xl font-bold font-mono tabular-nums transition-colors duration-300 ${priceUp ? 'text-[#6EC5A2]' : 'text-[#F4532B]'}`}>
              ${fmt(currentPrice)}
            </span>
            <span className={`text-xs ${priceUp ? 'text-[#6EC5A2]' : 'text-[#F4532B]'}`}>
              {priceUp ? '▲' : '▼'}
            </span>
          </div>
        )}
      </div>
      <div ref={containerRef} data-testid="price-chart" className="w-full" />
    </div>
  )
}

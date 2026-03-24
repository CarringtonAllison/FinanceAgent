import { useEffect, useRef } from 'react'
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

export function PriceChart({ bars, ticker, streamUrl }: PriceChartProps) {
  if (!ticker) {
    return (
      <div
        data-testid="price-chart-placeholder"
        className="flex h-[320px] w-full items-center justify-center rounded-xl border border-slate-800 bg-gray-900"
      >
        <p className="text-sm text-slate-500">Enter a ticker symbol to view the chart.</p>
      </div>
    )
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#111827' },
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
      upColor: '#4ade80',
      downColor: '#f87171',
      borderUpColor: '#4ade80',
      borderDownColor: '#f87171',
      wickUpColor: '#4ade80',
      wickDownColor: '#f87171',
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

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
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [streamUrl])

  return (
    <div className="w-full bg-gray-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-100 font-bold text-lg font-mono">{ticker}</span>
        <span className="text-xs text-slate-500">1 Min</span>
      </div>
      <div ref={containerRef} data-testid="price-chart" className="w-full" />
    </div>
  )
}

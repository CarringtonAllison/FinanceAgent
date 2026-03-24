import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Suggestion {
  symbol: string
  name: string
}

interface TickerSearchProps {
  onAnalyze: (ticker: string) => void
  loading: boolean
}

export function TickerSearch({ onAnalyze, loading }: TickerSearchProps) {
  const [ticker, setTicker] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (showDropdown && inputRef.current) {
      setDropdownRect(inputRef.current.getBoundingClientRect())
    }
  }, [showDropdown])

  useEffect(() => {
    if (!showDropdown) return
    function onResize() {
      if (inputRef.current) setDropdownRect(inputRef.current.getBoundingClientRect())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [showDropdown])

  function handleChange(value: string) {
    const upper = value.toUpperCase()
    setTicker(upper)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!upper.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/assets/search?q=${encodeURIComponent(upper)}`)
        const data = await res.json() as Suggestion[]
        setSuggestions(data)
        setShowDropdown(data.length > 0)
      } catch {
        setSuggestions([])
        setShowDropdown(false)
      }
    }, 200)
  }

  function handleSelect(symbol: string) {
    setTicker(symbol)
    setSuggestions([])
    setShowDropdown(false)
    onAnalyze(symbol)
  }

  function handleSubmit() {
    const trimmed = ticker.trim()
    if (!trimmed) return
    setSuggestions([])
    setShowDropdown(false)
    onAnalyze(trimmed)
  }

  const dropdown = showDropdown && dropdownRect
    ? createPortal(
        <ul
          data-testid="suggestions-dropdown"
          style={{
            position: 'fixed',
            top: dropdownRect.bottom + 4,
            left: dropdownRect.left,
            width: dropdownRect.width,
          }}
          className="z-50 rounded-lg border border-[#1AAA89]/30 bg-[#0d1f1a] shadow-xl overflow-hidden"
        >
          {suggestions.map((s) => (
            <li
              key={s.symbol}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s.symbol)}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#162820] transition-colors"
            >
              <span className="font-mono font-bold text-slate-100 w-16 shrink-0">{s.symbol}</span>
              <span className="text-sm text-slate-400 truncate">{s.name}</span>
            </li>
          ))}
        </ul>,
        document.body
      )
    : null

  return (
    <div className="flex gap-3 w-full max-w-md">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={ticker}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          onBlur={() => setShowDropdown(false)}
          placeholder="AAPL"
          className="w-full bg-[#0d1f1a] border border-[#1AAA89]/30 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#1AAA89] uppercase tracking-widest font-mono"
        />
        {dropdown}
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-[#1AAA89] hover:bg-[#22C49C] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg transition-colors"
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </div>
  )
}

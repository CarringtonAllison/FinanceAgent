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
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

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

  // Reset active index whenever suggestion list changes
  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex])

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
        // Only open dropdown if the input still has focus
        setShowDropdown(data.length > 0 && document.activeElement === inputRef.current)
      } catch {
        setSuggestions([])
        setShowDropdown(false)
      }
    }, 200)
  }

  function handleSelect(symbol: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setTicker(symbol)
    setSuggestions([])
    setShowDropdown(false)
    setActiveIndex(-1)
    onAnalyze(symbol)
  }

  function handleSubmit() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = ticker.trim()
    if (!trimmed) return
    setSuggestions([])
    setShowDropdown(false)
    setActiveIndex(-1)
    onAnalyze(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) {
      if (e.key === 'Enter') handleSubmit()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex].symbol)
      } else {
        handleSubmit()
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setActiveIndex(-1)
    }
  }

  const dropdown = showDropdown && isFocused && dropdownRect
    ? createPortal(
        <ul
          ref={listRef}
          data-testid="suggestions-dropdown"
          style={{
            position: 'fixed',
            top: dropdownRect.bottom + 4,
            left: dropdownRect.left,
            width: dropdownRect.width,
          }}
          className="z-50 rounded-lg border border-[#1AAA89]/30 bg-[#0d1f1a] shadow-xl overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.symbol}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => handleSelect(s.symbol)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                i === activeIndex ? 'bg-[#1AAA89]/20 text-[#6EC5A2]' : 'hover:bg-[#162820]'
              }`}
            >
              <span className={`font-mono font-bold w-16 shrink-0 ${i === activeIndex ? 'text-[#6EC5A2]' : 'text-slate-100'}`}>
                {s.symbol}
              </span>
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
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); setShowDropdown(false); setActiveIndex(-1) }}
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

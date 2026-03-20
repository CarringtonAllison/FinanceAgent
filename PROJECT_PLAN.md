# Finance Agent — Project Plan

## Overview
A day trader paper trading simulator powered by AI agents. Users get a fake account
with starting cash, search a real stock ticker, receive AI-powered analysis from
multiple specialized agents, then decide to buy or sell. Portfolio updates in real
time with full P&L tracking — realistic day trading with zero risk.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS + Recharts |
| Backend | Python + FastAPI |
| Agents | Python classes (single responsibility) |
| Real-time data | Alpaca Markets API (paper trading) |
| News data | NewsAPI (free tier) or Polygon.io |
| AI | Anthropic Claude API — Sentiment + Recommendation agents ONLY |
| Paper trading | Alpaca paper trading account (built-in fake money) |
| Storage | SQLite |
| Output | JSON file written server-side, downloadable from UI |

---

## Agent Architecture

**Rule: Maximum 2 Claude API calls per analysis run to minimize costs.**

### 1. Orchestrator Agent _(pure code — no Claude call)_
- Coordinates all agents
- Merges all agent outputs
- Writes final JSON recommendation file

### 2. Market Data Agent _(pure code — no Claude call)_
- Calls Alpaca API for real-time price, OHLC, volume
- Streams data via WebSocket
- Uses free IEX data from Alpaca paper account

### 3. Technical Analysis Agent _(pure code — no Claude call)_
- Calculates RSI, MACD, EMA crossovers (9/21), Bollinger Bands
- Uses `pandas-ta` library
- Identifies buy/sell signals based on indicator thresholds
- Returns structured signal data

### 4. Sentiment Agent _(uses Claude API — 1 call per analysis)_
- Fetches 5-10 recent news headlines for the ticker
- Sends all headlines to Claude in a single batch call
- Returns: bullish / neutral / bearish + reasoning

### 5. Recommendation Agent _(uses Claude API — 1 call per analysis)_
- Receives merged output from all other agents
- Generates final BUY / SELL / HOLD recommendation
- Returns confidence score (0–1) and plain-English reasoning

---

## Paper Trading Account
- Alpaca built-in paper trading environment
- Starting balance: $10,000 (configurable)
- Tracks open positions, average cost, unrealized P&L
- Full trade history stored in SQLite

---

## Environment Variables (`.env`)
```
ALPACA_API_KEY=
ALPACA_SECRET_KEY=
ALPACA_BASE_URL=https://paper-api.alpaca.markets
ANTHROPIC_API_KEY=
NEWS_API_KEY=
```

---

## JSON Output File Structure
```json
{
  "ticker": "AAPL",
  "timestamp": "2026-03-20T10:30:00Z",
  "market_data": {
    "price": 213.50,
    "volume": 4200000,
    "52w_high": 237.23,
    "52w_low": 164.08
  },
  "technical_signals": {
    "rsi": 58,
    "macd": "bullish_crossover",
    "ema_crossover": "bullish",
    "trend": "upward"
  },
  "sentiment": {
    "score": "bullish",
    "confidence": 0.74,
    "headlines": []
  },
  "risk": {
    "beta": 1.2,
    "atr": 3.40,
    "volatility": "medium"
  },
  "recommendation": {
    "action": "BUY",
    "confidence": 0.81,
    "reasoning": "..."
  }
}
```

---

## Dashboard UI Sections

1. **Portfolio Bar** — starting cash, total value, total P&L, daily P&L
2. **Ticker Search** — symbol input + Analyze button
3. **Agent Progress Tracker** — live status per agent via SSE (Pending → Running → Complete)
4. **Price Chart** — real-time candlestick chart + RSI and MACD panels (Recharts)
5. **Sentiment Card** — score + headline summaries
6. **Recommendation Card** — BUY/SELL/HOLD + confidence % + Claude's reasoning
7. **Trade Panel** — share quantity input, estimated cost, Buy/Sell buttons, balance validation
8. **Positions Table** — ticker, shares, avg cost, current price, unrealized P&L
9. **Trade History Log** — date, ticker, action, shares, price, total
10. **Download Report Button** — downloads latest JSON analysis file for current ticker

---

## Phased Build Plan

### Phase 1 — Foundation
- Set up FastAPI backend folder structure
- Connect to Alpaca API with paper trading credentials
- Set up SQLite schema (portfolio, positions, trades)
- Health check endpoint
- Verify React frontend connects to backend
- Install all dependencies (frontend + backend)

### Phase 2 — Market Data + Technical Analysis
- Market Data Agent: real-time price feed via Alpaca WebSocket
- Candlestick chart in React with Recharts
- Technical Analysis Agent: RSI, MACD, EMA with `pandas-ta`

### Phase 3 — AI Agents
- Sentiment Agent: news fetch + single Claude API call
- Recommendation Agent: merged data + single Claude API call
- Orchestrator: wire all agents, write JSON output
- SSE endpoint for live agent progress streaming to UI

### Phase 4 — Paper Trading
- Buy/sell order execution via Alpaca paper API
- Portfolio tracking and P&L calculations
- Positions table and trade history UI

### Phase 5 — Polish
- Agent progress UI animations
- JSON report download button
- Responsive design cleanup
- Error handling and loading states

---

## Constraints
- Max 2 Claude API calls per analysis run
- Free APIs only — no paid data subscriptions
- Single ticker at a time now, architected for multiple later
- All keys in `.env` — never hardcoded
- SQLite only — no external database

# Finance Agent — Project Plan

## Overview
A day trader paper trading simulator powered by AI agents. Users get a fake account
with starting cash, search a real stock ticker, receive AI-powered analysis from
multiple specialized agents, then decide to buy or sell. Portfolio updates in real
time with full P&L tracking — realistic day trading with zero risk.

---

## Tech Stack

| Layer | Technology | Status |
|---|---|---|
| Frontend | React + Tailwind CSS v4 + lightweight-charts | ✅ In use |
| Backend | Python 3.14 + FastAPI | ✅ In use |
| Agents | Python classes (single responsibility) | 🔄 Partial |
| Real-time data | Alpaca Markets API (paper trading) | ✅ In use |
| News data | NewsAPI (free tier) or Polygon.io | ⏳ Phase 3 |
| AI | Anthropic Claude API — Sentiment + Recommendation only | ⏳ Phase 3 |
| Paper trading | Alpaca paper trading account | ⏳ Phase 4 |
| Storage | SQLite | ✅ In use |
| Output | JSON file written server-side, downloadable from UI | ⏳ Phase 3 |

> **Note:** `lightweight-charts` (TradingView) used instead of Recharts — native candlestick support.
> `ta` library used instead of `pandas-ta` — `pandas-ta` depends on `numba` which doesn't support Python 3.14.

---

## Agent Architecture

**Rule: Maximum 2 Claude API calls per analysis run to minimize costs.**

### 1. Orchestrator Agent _(pure code — no Claude call)_ ⏳ Phase 3
- Coordinates all agents
- Merges all agent outputs
- Writes final JSON recommendation file

### 2. Market Data Agent _(pure code — no Claude call)_ ✅ Complete
- Calls Alpaca API for real-time price, OHLC, volume
- Streams data via Alpaca WebSocket → SSE to frontend
- Uses free IEX data from Alpaca paper account

### 3. Technical Analysis Agent _(pure code — no Claude call)_ ✅ Complete
- Calculates RSI, MACD, EMA crossovers (9/21), Bollinger Bands
- Uses `ta` library (Python 3.14 compatible)
- Returns structured signal data

### 4. Sentiment Agent _(uses Claude API — 1 call per analysis)_ ⏳ Phase 3
- Fetches 5-10 recent news headlines for the ticker
- Sends all headlines to Claude in a single batch call
- Returns: bullish / neutral / bearish + reasoning

### 5. Recommendation Agent _(uses Claude API — 1 call per analysis)_ ⏳ Phase 3
- Receives merged output from all other agents
- Generates final BUY / SELL / HOLD recommendation
- Returns confidence score (0–1) and plain-English reasoning

---

## Paper Trading Account
- Alpaca built-in paper trading environment
- Starting balance: $1,000 (configurable)
- Tracks open positions, average cost, unrealized P&L
- Full trade history stored in SQLite

---

## Environment Variables (`backend/.env`)
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

| # | Section | Status |
|---|---|---|
| 1 | **Portfolio Bar** — cash, total value, P&L | ⏳ Phase 4 |
| 2 | **Ticker Search** — symbol input + Analyze button | ✅ Complete |
| 3 | **Agent Progress Tracker** — live SSE status per agent | ⏳ Phase 3 |
| 4 | **Price Chart** — real-time candlestick + RSI/MACD panels | ✅ Complete |
| 5 | **Sentiment Card** — score + headlines | ⏳ Phase 3 |
| 6 | **Recommendation Card** — BUY/SELL/HOLD + reasoning | ⏳ Phase 3 |
| 7 | **Trade Panel** — shares input, cost estimate, Buy/Sell | ⏳ Phase 4 |
| 8 | **Positions Table** — open positions + unrealized P&L | ⏳ Phase 4 |
| 9 | **Trade History Log** — full trade log | ⏳ Phase 4 |
| 10 | **Download Report Button** — JSON analysis file | ⏳ Phase 3 |

---

## Phased Build Plan

### ✅ Phase 1 — Foundation
- FastAPI backend folder structure (`/backend`)
- SQLite schema: `portfolio`, `positions`, `trades` tables
- `/health` endpoint
- React frontend connects to backend with live status indicator
- Vitest + React Testing Library set up
- pytest + pytest-asyncio set up
- **Tests: 13 frontend, 9 backend — all green**

### ✅ Phase 2 — Market Data + Technical Analysis
- Market Data Agent: Alpaca REST (bars, snapshot) + WebSocket stream → SSE
- Endpoints: `/market-data/{ticker}/bars`, `/snapshot`, `/stream`
- Technical Analysis Agent: RSI, MACD, EMA (9/21), Bollinger Bands via `ta`
- Endpoint: `/analysis/{ticker}`
- `TickerSearch` component — uppercase input, Analyze button
- `PriceChart` component — lightweight-charts candlestick, real-time SSE updates
- **Tests: 13 frontend, 27 backend — all green**
- **Notable decisions:** `lightweight-charts` over Recharts, `ta` over `pandas-ta`

### ⏳ Phase 3 — AI Agents _(next up)_
- Sentiment Agent: fetch news headlines + single Claude API call
- Recommendation Agent: merged data + single Claude API call
- Orchestrator Agent: wire all agents, write JSON output file
- SSE endpoint for live agent progress (Pending → Running → Complete)
- Sentiment Card UI component
- Recommendation Card UI component
- Agent Progress Tracker UI component
- Download Report button

### ⏳ Phase 4 — Paper Trading
- Buy/sell order execution via Alpaca paper API
- Portfolio bar: cash, total value, daily P&L
- Trade Panel UI component
- Positions Table UI component
- Trade History Log UI component

### ⏳ Phase 5 — Polish
- Agent progress UI animations
- Responsive design cleanup
- Error handling and loading states throughout

---

## Constraints
- Max 2 Claude API calls per analysis run
- Free APIs only — no paid data subscriptions
- Single ticker at a time now, architected for multiple later
- All keys in `backend/.env` — never hardcoded
- SQLite only — no external database

---

## Running Locally

```bash
# Backend
cd backend
uvicorn backend.main:app --reload

# Frontend (separate terminal)
npm run dev

# Tests
python -m pytest backend/tests/ -v
npm test
```

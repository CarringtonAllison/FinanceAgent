# Finance Agent

A paper trading simulator powered by a multi-agent AI system. Enter a ticker symbol and the system dispatches four specialized agents in sequence — each passing its output to the next — before surfacing a Claude-generated BUY/SELL/HOLD recommendation.

## How the Multi-Agent System Works

The core insight is **specialization + sequencing**: each agent does one thing well, and the orchestrator pipes results forward so every downstream agent has richer context than it could compute alone.

```
GET /orchestrate/{ticker}/run  →  SSE stream
│
├─ MarketDataAgent        fetch 100 1-min bars + live snapshot via Alpaca REST
├─ TechnicalAnalysisAgent compute RSI, MACD, EMA crossover, Bollinger Bands, trend
├─ SentimentAgent         fetch 10 news headlines via NewsAPI → Claude Haiku scores them
└─ RecommendationAgent    merge all signals → Claude Sonnet issues BUY/SELL/HOLD
                                            → write JSON report to backend/reports/
```

Every agent yields a `running` event before it starts and a `complete` event with its result when done. The frontend consumes this SSE stream and updates each agent's status card in real time.

### Agent Details

| Agent | Model | Input | Output |
|---|---|---|---|
| `MarketDataAgent` | — | Alpaca REST | OHLCV bars, live price/volume snapshot |
| `TechnicalAnalysisAgent` | — | bars | RSI, MACD trend, EMA crossover, Bollinger bands, overall trend |
| `SentimentAgent` | Claude Haiku | headlines | `bullish` / `neutral` / `bearish`, confidence, reasoning |
| `RecommendationAgent` | Claude Sonnet | snapshot + signals + sentiment | `BUY` / `SELL` / `HOLD`, confidence, reasoning |

**Exactly 2 Claude API calls per full analysis run** — one for sentiment scoring (Haiku, fast + cheap), one for the final recommendation (Sonnet, better reasoning).

### SSE Event Format

```json
{"agent": "market_data",        "status": "running",  "result": null}
{"agent": "market_data",        "status": "complete", "result": {"price": 213.5, ...}}
{"agent": "technical_analysis", "status": "running",  "result": null}
{"agent": "technical_analysis", "status": "complete", "result": {"rsi": 58.2, ...}}
{"agent": "sentiment",          "status": "running",  "result": null}
{"agent": "sentiment",          "status": "complete", "result": {"score": "bullish", ...}}
{"agent": "recommendation",     "status": "running",  "result": null}
{"agent": "recommendation",     "status": "complete", "result": {"action": "BUY", ...}}
{"agent": "done",               "status": "complete", "result": {...}, "report": "AAPL_20260324_103000.json"}
```

## Tech Stack

**Frontend** — React 19, TypeScript, Vite, Tailwind CSS v4
**Backend** — Python 3.14, FastAPI, SQLAlchemy, SQLite
**Data** — Alpaca Markets API (REST + WebSocket streaming)
**AI** — Anthropic Claude API (`claude-haiku-4-5-20251001` + `claude-sonnet-4-6`)
**News** — NewsAPI

## Prerequisites

- Node.js 20+
- Python 3.14+
- [Alpaca Markets account](https://alpaca.markets) (paper trading, free)
- [Anthropic API key](https://console.anthropic.com)
- [NewsAPI key](https://newsapi.org) (optional — sentiment falls back to neutral if absent)

## Setup

**1. Clone and install frontend deps**
```bash
git clone <repo-url>
cd financeAgent
npm install
```

**2. Install backend deps**
```bash
pip install -r backend/requirements.txt
```

**3. Configure environment**

Create `backend/.env`:
```env
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret
ANTHROPIC_API_KEY=your_anthropic_key
NEWS_API_KEY=your_newsapi_key   # optional
```

## Running Locally

```bash
# Terminal 1 — backend
uvicorn backend.main:app --reload

# Terminal 2 — frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Running Tests

```bash
# Backend
python -m pytest backend/tests/ -v

# Frontend
npm run test

# TypeScript build check
npm run build
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Backend health check |
| `GET` | `/market-data/{ticker}/bars` | OHLCV bars (Alpaca REST) |
| `GET` | `/market-data/{ticker}/snapshot` | Live price snapshot |
| `GET` | `/market-data/{ticker}/stream` | Live bar stream (SSE) |
| `GET` | `/orchestrate/{ticker}/run` | Full agent pipeline (SSE) |
| `GET` | `/orchestrate/reports/{filename}` | Download JSON report |
| `GET` | `/portfolio` | Current portfolio summary |
| `POST` | `/portfolio/trade` | Execute a paper trade |
| `GET` | `/portfolio/trades` | Trade history |

## Project Structure

```
financeAgent/
├── backend/
│   ├── agents/
│   │   ├── market_data.py        # Alpaca REST + WebSocket
│   │   ├── technical_analysis.py # RSI, MACD, EMA, Bollinger
│   │   ├── sentiment.py          # NewsAPI + Claude Haiku
│   │   ├── recommendation.py     # Claude Sonnet
│   │   ├── orchestrator.py       # Sequencing + SSE events
│   │   └── portfolio.py          # Paper trading logic
│   ├── routers/                  # FastAPI route handlers
│   ├── reports/                  # Generated JSON analysis reports
│   ├── tests/                    # Pytest test suite
│   ├── database.py               # SQLAlchemy models + init
│   └── main.py                   # FastAPI app + lifespan
└── src/
    ├── components/
    │   ├── AgentProgressTracker  # Live per-agent status cards
    │   ├── PriceChart            # Candlestick chart + live stream
    │   ├── SentimentCard         # Score + headlines + reasoning
    │   ├── RecommendationCard    # Action + confidence + reasoning
    │   ├── TradePanel            # BUY/SELL form
    │   ├── PortfolioBar          # Cash + total value + P&L
    │   ├── PositionsTable        # Open positions
    │   └── TradeHistoryLog       # Trade history
    └── App.tsx                   # Root — wires SSE stream to components
```

# Finance Agent

A paper trading simulator powered by a multi-agent AI system. Enter a ticker symbol and the system dispatches four specialized agents in sequence — each passing its output to the next — before surfacing a detailed Claude-generated analysis with a BUY/SELL/HOLD recommendation, price targets, risk assessment, and actionable entry/exit levels.

## Demo

https://github.com/user-attachments/assets/f607e7b3-24a8-4e1b-b747-8640d2a89ee2

## How the Multi-Agent System Works

The core insight is **specialization + sequencing**: each agent does one thing well, and the orchestrator pipes results forward so every downstream agent has richer context than it could compute alone.

```
GET /orchestrate/{ticker}/run  →  SSE stream
│
├─ MarketDataAgent        fetch 100 1-min bars + live snapshot via Alpaca REST
├─ TechnicalAnalysisAgent compute RSI, MACD, EMA crossover, Bollinger Bands, trend
├─ SentimentAgent         fetch 10 news articles via NewsAPI → Claude Sonnet scores sentiment,
│                         identifies key themes, returns articles with clickable URLs
└─ RecommendationAgent    merge all signals → Claude Sonnet issues full analysis:
                          action, confidence, reasoning, key factors, risk level,
                          time horizon, entry/stop-loss/target prices
                          → write JSON report to backend/reports/
```

Every agent yields a `running` event before it starts and a `complete` event with its result when done. The frontend consumes this SSE stream and updates each agent's status card in real time.

### Agent Details

| Agent | Model | Input | Output |
|---|---|---|---|
| `MarketDataAgent` | — | Alpaca REST | OHLCV bars, live price/volume snapshot |
| `TechnicalAnalysisAgent` | — | bars | RSI, MACD (value/signal/histogram/trend), EMA crossover, Bollinger bands, overall trend |
| `SentimentAgent` | Claude Sonnet | news articles | `bullish` / `neutral` / `bearish`, confidence, 2-3 sentence reasoning, key themes, article links |
| `RecommendationAgent` | Claude Sonnet | snapshot + signals + sentiment | `BUY` / `SELL` / `HOLD`, confidence, reasoning, key factors, risk level, time horizon, entry/stop-loss/target prices |

**Exactly 2 Claude API calls per full analysis run** — both using Sonnet for the highest-quality analysis at every step.

### SSE Event Format

```json
{"agent": "market_data",        "status": "running",  "result": null}
{"agent": "market_data",        "status": "complete", "result": {"price": 213.5, ...}}
{"agent": "technical_analysis", "status": "running",  "result": null}
{"agent": "technical_analysis", "status": "complete", "result": {"rsi": 58.2, ...}}
{"agent": "sentiment",          "status": "running",  "result": null}
{"agent": "sentiment",          "status": "complete", "result": {"score": "bullish", "confidence": 0.85, "key_themes": [...], "headlines": [{"title": "...", "url": "..."}], ...}}
{"agent": "recommendation",     "status": "running",  "result": null}
{"agent": "recommendation",     "status": "complete", "result": {"action": "BUY", "confidence": 0.81, "key_factors": [...], "risk_level": "medium", "time_horizon": "short", "entry_price": 213.50, "stop_loss": 210.00, "target_price": 220.00, ...}}
{"agent": "done",               "status": "complete", "result": {...}, "report": "AAPL_20260324_103000.json"}
```

## Tech Stack

**Frontend** — React 19, TypeScript, Vite, Tailwind CSS v4
**Backend** — Python 3.14, FastAPI, SQLAlchemy, SQLite
**Data** — Alpaca Markets API (REST + WebSocket streaming)
**AI** — Anthropic Claude API (`claude-sonnet-4-6` for both sentiment and recommendation)
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
git clone https://github.com/CarringtonAllison/FinanceAgent.git
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
│   │   ├── sentiment.py          # NewsAPI + Claude Sonnet
│   │   ├── recommendation.py     # Claude Sonnet
│   │   ├── orchestrator.py       # Sequencing + SSE events
│   │   ├── portfolio.py          # Paper trading logic
│   │   └── retry.py              # Retry utility for flaky calls
│   ├── routers/                  # FastAPI route handlers
│   ├── reports/                  # Generated JSON analysis reports
│   ├── tests/                    # Pytest test suite
│   ├── database.py               # SQLAlchemy models + init
│   └── main.py                   # FastAPI app + lifespan
└── src/
    ├── components/
    │   ├── AgentProgressTracker  # Live per-agent status cards
    │   ├── PriceChart            # Candlestick chart + live stream
    │   ├── SentimentCard         # Score + key themes + linked article headlines + reasoning
    │   ├── RecommendationCard    # Action + confidence + key factors + risk/horizon + price levels
    │   ├── TradePanel            # BUY/SELL form
    │   ├── PortfolioBar          # Cash + total value + P&L
    │   ├── PositionsTable        # Open positions
    │   ├── TradeHistoryLog       # Trade history
    │   └── ErrorBanner           # Global error display
    └── App.tsx                   # Root — wires SSE stream to components
```

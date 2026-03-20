from fastapi import APIRouter, HTTPException

from backend.agents.market_data import MarketDataAgent
from backend.agents.technical_analysis import TechnicalAnalysisAgent

router = APIRouter(prefix="/analysis")


@router.get("/{ticker}")
async def get_analysis(ticker: str) -> dict:
    market_agent = MarketDataAgent()
    ta_agent = TechnicalAnalysisAgent()

    bars = market_agent.get_bars(ticker.upper(), timeframe="1Min", limit=100)

    try:
        result = ta_agent.analyze(bars)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {"ticker": ticker.upper(), **result}

import asyncio
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from backend.agents.market_data import MarketDataAgent

router = APIRouter(prefix="/market-data")


@router.get("/{ticker}/bars")
async def get_bars(ticker: str, timeframe: str = "1Min", limit: int = 100) -> dict:
    agent = MarketDataAgent()
    try:
        bars = agent.get_bars(ticker.upper(), timeframe=timeframe, limit=limit)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker.upper()}' not found. Please check the symbol and try again.")
    return {"ticker": ticker.upper(), "bars": bars}


@router.get("/{ticker}/snapshot")
async def get_snapshot(ticker: str) -> dict:
    agent = MarketDataAgent()
    try:
        return agent.get_snapshot(ticker.upper())
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker.upper()}' not found. Please check the symbol and try again.")


@router.get("/{ticker}/stream")
async def stream_bars(ticker: str) -> StreamingResponse:
    agent = MarketDataAgent()

    async def event_generator():
        async for bar in agent.stream_bars(ticker.upper()):
            yield f"data: {json.dumps(bar)}\n\n"
            await asyncio.sleep(0)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

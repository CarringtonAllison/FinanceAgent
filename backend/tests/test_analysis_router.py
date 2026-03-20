from unittest.mock import MagicMock, patch
from httpx import AsyncClient, ASGITransport
import pytest

from backend.main import app

MOCK_BARS = [
    {"time": 1700000000 + i * 60, "open": 210.0 + i * 0.2, "high": 211.0 + i * 0.2,
     "low": 209.0 + i * 0.2, "close": 210.5 + i * 0.2, "volume": 100000.0}
    for i in range(30)
]

MOCK_SIGNALS = {
    "signals": {
        "rsi": 58.4,
        "macd": {"value": 0.42, "signal": 0.31, "histogram": 0.11, "trend": "bullish_crossover"},
        "ema": {"ema9": 213.2, "ema21": 212.8, "crossover": "bullish"},
        "bollinger": {"upper": 216.0, "middle": 213.5, "lower": 211.0},
        "trend": "upward",
    }
}


@pytest.mark.asyncio
async def test_analysis_returns_200() -> None:
    with patch("backend.routers.analysis.MarketDataAgent") as MockMD, \
         patch("backend.routers.analysis.TechnicalAnalysisAgent") as MockTA:
        MockMD.return_value.get_bars.return_value = MOCK_BARS
        MockTA.return_value.analyze.return_value = MOCK_SIGNALS
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/analysis/AAPL")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_analysis_returns_ticker() -> None:
    with patch("backend.routers.analysis.MarketDataAgent") as MockMD, \
         patch("backend.routers.analysis.TechnicalAnalysisAgent") as MockTA:
        MockMD.return_value.get_bars.return_value = MOCK_BARS
        MockTA.return_value.analyze.return_value = MOCK_SIGNALS
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/analysis/AAPL")
    assert response.json()["ticker"] == "AAPL"


@pytest.mark.asyncio
async def test_analysis_returns_signals() -> None:
    with patch("backend.routers.analysis.MarketDataAgent") as MockMD, \
         patch("backend.routers.analysis.TechnicalAnalysisAgent") as MockTA:
        MockMD.return_value.get_bars.return_value = MOCK_BARS
        MockTA.return_value.analyze.return_value = MOCK_SIGNALS
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/analysis/AAPL")
    data = response.json()
    assert "signals" in data
    assert "rsi" in data["signals"]

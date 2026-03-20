from unittest.mock import MagicMock, patch
from httpx import AsyncClient, ASGITransport
import pytest

from backend.main import app

MOCK_BARS = [
    {"time": 1700000000, "open": 213.0, "high": 214.5, "low": 212.0, "close": 213.5, "volume": 1234567.0}
]

MOCK_SNAPSHOT = {"ticker": "AAPL", "price": 213.50, "volume": 4200000.0}


@pytest.mark.asyncio
async def test_get_bars_returns_200() -> None:
    with patch("backend.routers.market_data.MarketDataAgent") as MockAgent:
        MockAgent.return_value.get_bars.return_value = MOCK_BARS
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/market-data/AAPL/bars")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_bars_returns_ticker_and_bars() -> None:
    with patch("backend.routers.market_data.MarketDataAgent") as MockAgent:
        MockAgent.return_value.get_bars.return_value = MOCK_BARS
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/market-data/AAPL/bars")
    data = response.json()
    assert data["ticker"] == "AAPL"
    assert isinstance(data["bars"], list)
    assert len(data["bars"]) == 1


@pytest.mark.asyncio
async def test_get_snapshot_returns_200() -> None:
    with patch("backend.routers.market_data.MarketDataAgent") as MockAgent:
        MockAgent.return_value.get_snapshot.return_value = MOCK_SNAPSHOT
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/market-data/AAPL/snapshot")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_snapshot_returns_price() -> None:
    with patch("backend.routers.market_data.MarketDataAgent") as MockAgent:
        MockAgent.return_value.get_snapshot.return_value = MOCK_SNAPSHOT
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/market-data/AAPL/snapshot")
    data = response.json()
    assert data["price"] == 213.50
    assert data["ticker"] == "AAPL"

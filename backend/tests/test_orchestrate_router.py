from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
import pytest

from backend.main import app

MOCK_EVENTS = [
    {"agent": "market_data", "status": "running", "result": None},
    {"agent": "market_data", "status": "complete", "result": {"ticker": "AAPL", "price": 213.5}},
    {"agent": "technical_analysis", "status": "running", "result": None},
    {"agent": "technical_analysis", "status": "complete", "result": {"rsi": 58.4}},
    {"agent": "sentiment", "status": "running", "result": None},
    {"agent": "sentiment", "status": "complete", "result": {"score": "bullish"}},
    {"agent": "recommendation", "status": "running", "result": None},
    {"agent": "recommendation", "status": "complete", "result": {"action": "BUY"}},
    {"agent": "done", "status": "complete", "result": {}, "report": "AAPL_test.json"},
]


async def mock_run(ticker: str):
    for event in MOCK_EVENTS:
        yield event


@pytest.mark.asyncio
async def test_orchestrate_run_returns_200() -> None:
    with patch("backend.routers.orchestrate.OrchestratorAgent") as MockOrch:
        MockOrch.return_value.run = mock_run
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/orchestrate/AAPL/run")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_orchestrate_run_returns_event_stream() -> None:
    with patch("backend.routers.orchestrate.OrchestratorAgent") as MockOrch:
        MockOrch.return_value.run = mock_run
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/orchestrate/AAPL/run")
    assert "text/event-stream" in response.headers["content-type"]


@pytest.mark.asyncio
async def test_orchestrate_run_response_contains_data_events() -> None:
    with patch("backend.routers.orchestrate.OrchestratorAgent") as MockOrch:
        MockOrch.return_value.run = mock_run
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/orchestrate/AAPL/run")
    assert "data:" in response.text

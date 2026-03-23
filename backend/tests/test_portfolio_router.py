from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app

MOCK_SUMMARY = {
    "cash_balance": 500.0,
    "total_value": 1100.0,
    "positions": [
        {
            "ticker": "AAPL",
            "shares": 5.0,
            "avg_cost": 100.0,
            "current_price": 120.0,
            "market_value": 600.0,
            "unrealized_pnl": 100.0,
            "unrealized_pnl_pct": 20.0,
        }
    ],
    "total_unrealized_pnl": 100.0,
}

MOCK_TRADE = MagicMock(
    id=1,
    ticker="AAPL",
    action="BUY",
    shares=5.0,
    price=100.0,
    total=500.0,
    created_at=MagicMock(isoformat=lambda: "2026-03-23T10:00:00+00:00"),
)

MOCK_TRADES_LIST = [MOCK_TRADE]


@pytest.mark.asyncio
async def test_get_portfolio_returns_200() -> None:
    with patch("backend.routers.portfolio.PortfolioAgent") as MockAgent:
        MockAgent.return_value.get_portfolio_summary.return_value = MOCK_SUMMARY
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/portfolio")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_portfolio_returns_cash_and_positions() -> None:
    with patch("backend.routers.portfolio.PortfolioAgent") as MockAgent:
        MockAgent.return_value.get_portfolio_summary.return_value = MOCK_SUMMARY
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/portfolio")
    data = response.json()
    assert data["cash_balance"] == 500.0
    assert len(data["positions"]) == 1
    assert data["positions"][0]["ticker"] == "AAPL"


@pytest.mark.asyncio
async def test_post_trade_buy_returns_200() -> None:
    with patch("backend.routers.portfolio.PortfolioAgent") as MockAgent:
        MockAgent.return_value.execute_trade.return_value = MOCK_TRADE
        MockAgent.return_value.get_portfolio_summary.return_value = MOCK_SUMMARY
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/portfolio/trade",
                json={"ticker": "AAPL", "action": "BUY", "shares": 5.0},
            )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_post_trade_returns_trade_and_portfolio() -> None:
    with patch("backend.routers.portfolio.PortfolioAgent") as MockAgent:
        MockAgent.return_value.execute_trade.return_value = MOCK_TRADE
        MockAgent.return_value.get_portfolio_summary.return_value = MOCK_SUMMARY
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/portfolio/trade",
                json={"ticker": "AAPL", "action": "BUY", "shares": 5.0},
            )
    data = response.json()
    assert "trade" in data
    assert "portfolio" in data
    assert data["trade"]["ticker"] == "AAPL"
    assert data["trade"]["action"] == "BUY"


@pytest.mark.asyncio
async def test_post_trade_insufficient_cash_returns_400() -> None:
    with patch("backend.routers.portfolio.PortfolioAgent") as MockAgent:
        MockAgent.return_value.execute_trade.side_effect = ValueError("insufficient cash: need 9999.00, have 100.00")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/portfolio/trade",
                json={"ticker": "AAPL", "action": "BUY", "shares": 100.0},
            )
    assert response.status_code == 400
    assert "insufficient cash" in response.json()["detail"]


@pytest.mark.asyncio
async def test_post_trade_insufficient_shares_returns_400() -> None:
    with patch("backend.routers.portfolio.PortfolioAgent") as MockAgent:
        MockAgent.return_value.execute_trade.side_effect = ValueError("insufficient shares: need 10, have 2")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/portfolio/trade",
                json={"ticker": "AAPL", "action": "SELL", "shares": 10.0},
            )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_trades_returns_200() -> None:
    with patch("backend.routers.portfolio.get_db_session") as mock_session:
        mock_session.return_value.__enter__ = MagicMock(return_value=MagicMock(
            query=MagicMock(return_value=MagicMock(
                order_by=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))
            ))
        ))
        mock_session.return_value.__exit__ = MagicMock(return_value=False)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/portfolio/trades")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_trades_returns_list() -> None:
    with patch("backend.routers.portfolio.get_db_session") as mock_session:
        mock_session.return_value.__enter__ = MagicMock(return_value=MagicMock(
            query=MagicMock(return_value=MagicMock(
                order_by=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))
            ))
        ))
        mock_session.return_value.__exit__ = MagicMock(return_value=False)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/portfolio/trades")
    data = response.json()
    assert "trades" in data
    assert isinstance(data["trades"], list)

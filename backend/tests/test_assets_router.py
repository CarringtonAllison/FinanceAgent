from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
import pytest

from backend.main import app

MOCK_ASSETS = [
    {"symbol": "AAPL", "name": "Apple Inc."},
    {"symbol": "AAPD", "name": "Direxion Daily AAPL Bear 1X Shares"},
    {"symbol": "AAPI", "name": "Immunovant Inc."},
    {"symbol": "MSFT", "name": "Microsoft Corporation"},
    {"symbol": "AMZN", "name": "Amazon.com Inc."},
    {"symbol": "ACN",  "name": "Accenture plc"},
]


@pytest.mark.asyncio
async def test_search_returns_empty_for_empty_query() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/assets/search?q=")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_search_returns_symbol_prefix_matches() -> None:
    with patch("backend.routers.assets._load_assets", return_value=MOCK_ASSETS):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/assets/search?q=AAP")
    symbols = [d["symbol"] for d in response.json()]
    assert "AAPL" in symbols
    assert "AAPD" in symbols
    assert "MSFT" not in symbols


@pytest.mark.asyncio
async def test_search_is_case_insensitive() -> None:
    with patch("backend.routers.assets._load_assets", return_value=MOCK_ASSETS):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/assets/search?q=aapl")
    assert any(d["symbol"] == "AAPL" for d in response.json())


@pytest.mark.asyncio
async def test_search_returns_max_8_results() -> None:
    many_assets = [{"symbol": f"AA{i:02d}", "name": f"Stock {i}"} for i in range(20)]
    with patch("backend.routers.assets._load_assets", return_value=many_assets):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/assets/search?q=AA")
    assert len(response.json()) <= 8


@pytest.mark.asyncio
async def test_search_returns_symbol_and_name_fields() -> None:
    with patch("backend.routers.assets._load_assets", return_value=MOCK_ASSETS):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/assets/search?q=AAPL")
    data = response.json()
    assert len(data) >= 1
    assert "symbol" in data[0]
    assert "name" in data[0]


@pytest.mark.asyncio
async def test_search_matches_company_name() -> None:
    with patch("backend.routers.assets._load_assets", return_value=MOCK_ASSETS):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/assets/search?q=Accenture")
    symbols = [d["symbol"] for d in response.json()]
    assert "ACN" in symbols


@pytest.mark.asyncio
async def test_name_search_is_case_insensitive() -> None:
    with patch("backend.routers.assets._load_assets", return_value=MOCK_ASSETS):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/assets/search?q=accenture")
    symbols = [d["symbol"] for d in response.json()]
    assert "ACN" in symbols


@pytest.mark.asyncio
async def test_symbol_matches_ranked_before_name_matches() -> None:
    assets = [
        {"symbol": "XGOO", "name": "Some Goo-Related Fund"},  # name match only
        {"symbol": "GOOG", "name": "Alphabet Inc. Class C"},  # symbol prefix match
        {"symbol": "GOOGL", "name": "Alphabet Inc. Class A"},  # symbol prefix match
    ]
    with patch("backend.routers.assets._load_assets", return_value=assets):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/assets/search?q=GOO")
    symbols = [d["symbol"] for d in response.json()]
    # Symbol prefix matches (GOOG, GOOGL) must appear before name-only match (XGOO)
    assert symbols.index("GOOG") < symbols.index("XGOO")
    assert symbols.index("GOOGL") < symbols.index("XGOO")


@pytest.mark.asyncio
async def test_no_duplicate_results_when_symbol_and_name_both_match() -> None:
    assets = [{"symbol": "AAPL", "name": "Apple AAPL Inc."}]
    with patch("backend.routers.assets._load_assets", return_value=assets):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/assets/search?q=AAPL")
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_search_returns_shorter_symbols_first() -> None:
    assets = [
        {"symbol": "AAPLX", "name": "Some Fund"},
        {"symbol": "AAPL", "name": "Apple Inc."},
    ]
    with patch("backend.routers.assets._load_assets", return_value=assets):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/assets/search?q=AAPL")
    symbols = [d["symbol"] for d in response.json()]
    assert symbols.index("AAPL") < symbols.index("AAPLX")

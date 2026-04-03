from unittest.mock import MagicMock, patch
import pytest

from backend.agents.market_data import MarketDataAgent


@pytest.fixture
def agent() -> MarketDataAgent:
    with patch("backend.agents.market_data.StockHistoricalDataClient"):
        return MarketDataAgent(api_key="test_key", secret_key="test_secret")


def test_get_bars_returns_list(agent: MarketDataAgent) -> None:
    mock_bar = MagicMock()
    mock_bar.timestamp.timestamp.return_value = 1700000000.0
    mock_bar.open = 213.0
    mock_bar.high = 214.5
    mock_bar.low = 212.0
    mock_bar.close = 213.5
    mock_bar.volume = 1234567.0

    mock_response = MagicMock()
    mock_response.__getitem__ = MagicMock(return_value=[mock_bar])
    agent._client.get_stock_bars.return_value = mock_response

    bars = agent.get_bars("AAPL")
    assert isinstance(bars, list)
    assert len(bars) == 1


def test_get_bars_returns_correct_keys(agent: MarketDataAgent) -> None:
    mock_bar = MagicMock()
    mock_bar.timestamp.timestamp.return_value = 1700000000.0
    mock_bar.open = 213.0
    mock_bar.high = 214.5
    mock_bar.low = 212.0
    mock_bar.close = 213.5
    mock_bar.volume = 1234567.0

    mock_response = MagicMock()
    mock_response.__getitem__ = MagicMock(return_value=[mock_bar])
    agent._client.get_stock_bars.return_value = mock_response

    bars = agent.get_bars("AAPL")
    assert {"time", "open", "high", "low", "close", "volume"}.issubset(bars[0].keys())


def test_get_snapshot_returns_correct_keys(agent: MarketDataAgent) -> None:
    mock_snapshot = MagicMock()
    mock_snapshot.latest_trade.price = 213.50
    mock_snapshot.daily_bar.volume = 4200000.0
    mock_snapshot.minute_bar.high = 214.0
    mock_snapshot.minute_bar.low = 212.0

    mock_response = MagicMock()
    mock_response.__getitem__ = MagicMock(return_value=mock_snapshot)
    agent._client.get_stock_snapshot.return_value = mock_response

    snapshot = agent.get_snapshot("AAPL")
    assert {"ticker", "price", "volume"}.issubset(snapshot.keys())


def test_get_bars_raises_runtime_error_on_api_exception(agent: MarketDataAgent) -> None:
    agent._client.get_stock_bars.side_effect = Exception("Connection refused")
    with pytest.raises(RuntimeError, match="AAPL"):
        agent.get_bars("AAPL")


def test_get_bars_raises_runtime_error_on_invalid_ticker(agent: MarketDataAgent) -> None:
    mock_response = MagicMock()
    mock_response.__getitem__ = MagicMock(side_effect=KeyError("FAKE"))
    agent._client.get_stock_bars.return_value = mock_response
    with pytest.raises(RuntimeError, match="not found"):
        agent.get_bars("FAKE")


def test_get_snapshot_raises_runtime_error_on_api_exception(agent: MarketDataAgent) -> None:
    agent._client.get_stock_snapshot.side_effect = Exception("Timeout")
    with pytest.raises(RuntimeError, match="AAPL"):
        agent.get_snapshot("AAPL")


def test_get_snapshot_raises_runtime_error_on_invalid_ticker(agent: MarketDataAgent) -> None:
    mock_response = MagicMock()
    mock_response.__getitem__ = MagicMock(side_effect=KeyError("FAKE"))
    agent._client.get_stock_snapshot.return_value = mock_response
    with pytest.raises(RuntimeError, match="not found"):
        agent.get_snapshot("FAKE")


def test_get_snapshot_returns_correct_ticker(agent: MarketDataAgent) -> None:
    mock_snapshot = MagicMock()
    mock_snapshot.latest_trade.price = 213.50
    mock_snapshot.daily_bar.volume = 4200000.0
    mock_snapshot.minute_bar.high = 214.0
    mock_snapshot.minute_bar.low = 212.0

    mock_response = MagicMock()
    mock_response.__getitem__ = MagicMock(return_value=mock_snapshot)
    agent._client.get_stock_snapshot.return_value = mock_response

    snapshot = agent.get_snapshot("AAPL")
    assert snapshot["ticker"] == "AAPL"

from unittest.mock import MagicMock, patch
import pytest

from backend.agents.recommendation import RecommendationAgent

MOCK_MARKET_DATA = {"ticker": "AAPL", "price": 213.50, "volume": 4200000.0}
MOCK_SIGNALS = {
    "rsi": 58.4,
    "macd": {"value": 0.42, "signal": 0.31, "histogram": 0.11, "trend": "bullish_crossover"},
    "ema": {"ema9": 213.2, "ema21": 212.8, "crossover": "bullish"},
    "bollinger": {"upper": 216.0, "middle": 213.5, "lower": 211.0},
    "trend": "upward",
}
MOCK_SENTIMENT = {"score": "bullish", "confidence": 0.8, "headlines": [], "reasoning": "Positive news."}


@pytest.fixture
def agent() -> RecommendationAgent:
    return RecommendationAgent()


def test_analyze_returns_required_keys(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text='{"action":"BUY","confidence":0.81,"reasoning":"Strong signals."}')]
        )
        result = agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)
    assert {"action", "confidence", "reasoning"}.issubset(result.keys())


def test_analyze_returns_valid_action(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text='{"action":"BUY","confidence":0.81,"reasoning":"Strong signals."}')]
        )
        result = agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)
    assert result["action"] in ("BUY", "SELL", "HOLD")


def test_analyze_returns_confidence_float(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text='{"action":"HOLD","confidence":0.55,"reasoning":"Mixed signals."}')]
        )
        result = agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)
    assert isinstance(result["confidence"], float)
    assert 0.0 <= result["confidence"] <= 1.0


def test_analyze_raises_without_api_key(agent: RecommendationAgent) -> None:
    with patch("backend.agents.recommendation.os.getenv", return_value=None):
        with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
            agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)

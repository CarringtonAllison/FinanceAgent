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
MOCK_SENTIMENT = {
    "score": "bullish",
    "confidence": 0.8,
    "headlines": [],
    "key_themes": ["earnings beat"],
    "reasoning": "Positive news.",
}

MOCK_CLAUDE_RESPONSE = (
    '{"action":"BUY","confidence":0.81,"reasoning":"Strong technical and sentiment alignment.",'
    '"key_factors":["RSI in bullish zone","MACD bullish crossover","positive news sentiment"],'
    '"risk_level":"medium","time_horizon":"short",'
    '"entry_price":213.50,"stop_loss":210.00,"target_price":220.00}'
)


@pytest.fixture
def agent() -> RecommendationAgent:
    return RecommendationAgent()


def test_analyze_returns_required_keys(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)
    required = {"action", "confidence", "reasoning", "key_factors", "risk_level", "time_horizon"}
    assert required.issubset(result.keys())


def test_analyze_returns_valid_action(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)
    assert result["action"] in ("BUY", "SELL", "HOLD")


def test_analyze_returns_confidence_float(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)
    assert isinstance(result["confidence"], float)
    assert 0.0 <= result["confidence"] <= 1.0


def test_analyze_returns_key_factors_list(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)
    assert isinstance(result["key_factors"], list)


def test_analyze_returns_valid_risk_level(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)
    assert result["risk_level"] in ("low", "medium", "high")


def test_analyze_returns_valid_time_horizon(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)
    assert result["time_horizon"] in ("short", "medium", "long")


def test_analyze_returns_price_targets(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)
    # entry_price, stop_loss, target_price may be null but keys must exist
    assert "entry_price" in result
    assert "stop_loss" in result
    assert "target_price" in result


def test_analyze_raises_without_api_key(agent: RecommendationAgent) -> None:
    with patch("backend.agents.recommendation.os.getenv", return_value=None):
        with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
            agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)


def test_analyze_raises_runtime_error_on_anthropic_api_failure(agent: RecommendationAgent) -> None:
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("backend.agents.recommendation.anthropic.Anthropic") as MockClaude:
        MockClaude.return_value.messages.create.side_effect = Exception("Anthropic service unavailable")
        with pytest.raises(RuntimeError, match="Recommendation"):
            agent.analyze("AAPL", MOCK_MARKET_DATA, MOCK_SIGNALS, MOCK_SENTIMENT)

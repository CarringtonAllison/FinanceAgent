from unittest.mock import MagicMock, patch
import pytest

from backend.agents.sentiment import SentimentAgent


@pytest.fixture
def agent() -> SentimentAgent:
    return SentimentAgent()


def test_analyze_returns_required_keys(agent: SentimentAgent) -> None:
    with patch("backend.agents.sentiment.NewsApiClient") as MockNews, \
         patch("backend.agents.sentiment.anthropic.Anthropic") as MockClaude:
        MockNews.return_value.get_everything.return_value = {
            "articles": [{"title": "Apple hits record high"}, {"title": "AAPL surges on earnings"}]
        }
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text='{"score":"bullish","confidence":0.8,"reasoning":"Strong positive news"}')]
        )
        result = agent.analyze("AAPL")
    assert {"score", "confidence", "headlines", "reasoning"}.issubset(result.keys())


def test_analyze_returns_valid_score(agent: SentimentAgent) -> None:
    with patch("backend.agents.sentiment.NewsApiClient") as MockNews, \
         patch("backend.agents.sentiment.anthropic.Anthropic") as MockClaude:
        MockNews.return_value.get_everything.return_value = {
            "articles": [{"title": "Apple hits record high"}]
        }
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text='{"score":"bullish","confidence":0.8,"reasoning":"Positive"}')]
        )
        result = agent.analyze("AAPL")
    assert result["score"] in ("bullish", "neutral", "bearish")


def test_analyze_returns_headlines_list(agent: SentimentAgent) -> None:
    with patch("backend.agents.sentiment.NewsApiClient") as MockNews, \
         patch("backend.agents.sentiment.anthropic.Anthropic") as MockClaude:
        MockNews.return_value.get_everything.return_value = {
            "articles": [{"title": "Apple hits record high"}, {"title": "AAPL surges"}]
        }
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text='{"score":"bullish","confidence":0.8,"reasoning":"Positive"}')]
        )
        result = agent.analyze("AAPL")
    assert isinstance(result["headlines"], list)


def test_analyze_falls_back_when_no_api_key(agent: SentimentAgent) -> None:
    with patch("backend.agents.sentiment.os.getenv", return_value=None):
        result = agent.analyze("AAPL")
    assert result["score"] == "neutral"
    assert result["headlines"] == []

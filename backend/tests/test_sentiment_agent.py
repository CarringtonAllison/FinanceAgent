from unittest.mock import MagicMock, patch
import pytest

from backend.agents.sentiment import SentimentAgent


@pytest.fixture
def agent() -> SentimentAgent:
    return SentimentAgent()


MOCK_ARTICLES = [
    {"title": "Apple hits record high", "url": "https://example.com/1"},
    {"title": "AAPL surges on earnings", "url": "https://example.com/2"},
]

MOCK_CLAUDE_RESPONSE = (
    '{"score":"bullish","confidence":0.8,'
    '"reasoning":"Strong positive news driven by earnings beat.",'
    '"key_themes":["earnings beat","record revenue","analyst upgrades"]}'
)

_ENV = {"NEWS_API_KEY": "test-news-key", "ANTHROPIC_API_KEY": "test-anthropic-key"}


def test_analyze_returns_required_keys(agent: SentimentAgent) -> None:
    with patch.dict("os.environ", _ENV), \
         patch("backend.agents.sentiment.NewsApiClient") as MockNews, \
         patch("backend.agents.sentiment.anthropic.Anthropic") as MockClaude:
        MockNews.return_value.get_everything.return_value = {"articles": MOCK_ARTICLES}
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL")
    assert {"score", "confidence", "headlines", "reasoning", "key_themes"}.issubset(result.keys())


def test_analyze_returns_valid_score(agent: SentimentAgent) -> None:
    with patch.dict("os.environ", _ENV), \
         patch("backend.agents.sentiment.NewsApiClient") as MockNews, \
         patch("backend.agents.sentiment.anthropic.Anthropic") as MockClaude:
        MockNews.return_value.get_everything.return_value = {"articles": MOCK_ARTICLES}
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL")
    assert result["score"] in ("bullish", "neutral", "bearish")


def test_headlines_are_objects_with_title_and_url(agent: SentimentAgent) -> None:
    with patch.dict("os.environ", _ENV), \
         patch("backend.agents.sentiment.NewsApiClient") as MockNews, \
         patch("backend.agents.sentiment.anthropic.Anthropic") as MockClaude:
        MockNews.return_value.get_everything.return_value = {"articles": MOCK_ARTICLES}
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL")
    assert isinstance(result["headlines"], list)
    assert len(result["headlines"]) > 0
    for item in result["headlines"]:
        assert "title" in item
        assert "url" in item


def test_analyze_returns_key_themes_list(agent: SentimentAgent) -> None:
    with patch.dict("os.environ", _ENV), \
         patch("backend.agents.sentiment.NewsApiClient") as MockNews, \
         patch("backend.agents.sentiment.anthropic.Anthropic") as MockClaude:
        MockNews.return_value.get_everything.return_value = {"articles": MOCK_ARTICLES}
        MockClaude.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text=MOCK_CLAUDE_RESPONSE)]
        )
        result = agent.analyze("AAPL")
    assert isinstance(result["key_themes"], list)


def test_analyze_falls_back_when_no_api_key(agent: SentimentAgent) -> None:
    with patch("backend.agents.sentiment.os.getenv", return_value=None):
        result = agent.analyze("AAPL")
    assert result["score"] == "neutral"
    assert result["headlines"] == []
    assert result["key_themes"] == []


def test_analyze_raises_runtime_error_on_news_api_failure(agent: SentimentAgent) -> None:
    with patch.dict("os.environ", _ENV), \
         patch("backend.agents.sentiment.NewsApiClient") as MockNews:
        MockNews.return_value.get_everything.side_effect = Exception("NewsAPI rate limit")
        with pytest.raises(RuntimeError, match="news"):
            agent.analyze("AAPL")


def test_analyze_raises_runtime_error_on_anthropic_failure(agent: SentimentAgent) -> None:
    with patch.dict("os.environ", _ENV), \
         patch("backend.agents.sentiment.NewsApiClient") as MockNews, \
         patch("backend.agents.sentiment.anthropic.Anthropic") as MockClaude:
        MockNews.return_value.get_everything.return_value = {"articles": MOCK_ARTICLES}
        MockClaude.return_value.messages.create.side_effect = Exception("Anthropic API error")
        with pytest.raises(RuntimeError, match="Sentiment"):
            agent.analyze("AAPL")

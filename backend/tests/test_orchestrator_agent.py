from unittest.mock import MagicMock, patch, AsyncMock
import pytest

from backend.agents.orchestrator import OrchestratorAgent

MOCK_BARS = [
    {"time": 1700000000 + i * 60, "open": 210.0, "high": 211.0,
     "low": 209.0, "close": 210.5, "volume": 100000.0}
    for i in range(30)
]
MOCK_SNAPSHOT = {"ticker": "AAPL", "price": 213.50, "volume": 4200000.0}
MOCK_SIGNALS = {"signals": {"rsi": 58.4, "macd": {}, "ema": {}, "bollinger": {}, "trend": "upward"}}
MOCK_SENTIMENT = {"score": "bullish", "confidence": 0.8, "headlines": [], "reasoning": "Positive."}
MOCK_RECOMMENDATION = {"action": "BUY", "confidence": 0.81, "reasoning": "Strong signals."}


@pytest.fixture
def agent() -> OrchestratorAgent:
    return OrchestratorAgent()


@pytest.mark.asyncio
async def test_run_yields_agent_progress_events(agent: OrchestratorAgent) -> None:
    with patch("backend.agents.orchestrator.MarketDataAgent") as MockMD, \
         patch("backend.agents.orchestrator.TechnicalAnalysisAgent") as MockTA, \
         patch("backend.agents.orchestrator.SentimentAgent") as MockSent, \
         patch("backend.agents.orchestrator.RecommendationAgent") as MockRec, \
         patch("backend.agents.orchestrator.OrchestratorAgent._write_report", return_value="AAPL_test.json"):
        MockMD.return_value.get_bars.return_value = MOCK_BARS
        MockMD.return_value.get_snapshot.return_value = MOCK_SNAPSHOT
        MockTA.return_value.analyze.return_value = MOCK_SIGNALS
        MockSent.return_value.analyze.return_value = MOCK_SENTIMENT
        MockRec.return_value.analyze.return_value = MOCK_RECOMMENDATION

        events = [event async for event in agent.run("AAPL")]

    agent_names = [e["agent"] for e in events]
    assert "market_data" in agent_names
    assert "technical_analysis" in agent_names
    assert "sentiment" in agent_names
    assert "recommendation" in agent_names
    assert "done" in agent_names


@pytest.mark.asyncio
async def test_run_final_event_has_report_filename(agent: OrchestratorAgent) -> None:
    with patch("backend.agents.orchestrator.MarketDataAgent") as MockMD, \
         patch("backend.agents.orchestrator.TechnicalAnalysisAgent") as MockTA, \
         patch("backend.agents.orchestrator.SentimentAgent") as MockSent, \
         patch("backend.agents.orchestrator.RecommendationAgent") as MockRec, \
         patch("backend.agents.orchestrator.OrchestratorAgent._write_report", return_value="AAPL_test.json"):
        MockMD.return_value.get_bars.return_value = MOCK_BARS
        MockMD.return_value.get_snapshot.return_value = MOCK_SNAPSHOT
        MockTA.return_value.analyze.return_value = MOCK_SIGNALS
        MockSent.return_value.analyze.return_value = MOCK_SENTIMENT
        MockRec.return_value.analyze.return_value = MOCK_RECOMMENDATION

        events = [event async for event in agent.run("AAPL")]

    done_event = next(e for e in events if e["agent"] == "done")
    assert "report" in done_event
    assert done_event["report"] == "AAPL_test.json"


@pytest.mark.asyncio
async def test_run_each_agent_has_running_and_complete(agent: OrchestratorAgent) -> None:
    with patch("backend.agents.orchestrator.MarketDataAgent") as MockMD, \
         patch("backend.agents.orchestrator.TechnicalAnalysisAgent") as MockTA, \
         patch("backend.agents.orchestrator.SentimentAgent") as MockSent, \
         patch("backend.agents.orchestrator.RecommendationAgent") as MockRec, \
         patch("backend.agents.orchestrator.OrchestratorAgent._write_report", return_value="AAPL_test.json"):
        MockMD.return_value.get_bars.return_value = MOCK_BARS
        MockMD.return_value.get_snapshot.return_value = MOCK_SNAPSHOT
        MockTA.return_value.analyze.return_value = MOCK_SIGNALS
        MockSent.return_value.analyze.return_value = MOCK_SENTIMENT
        MockRec.return_value.analyze.return_value = MOCK_RECOMMENDATION

        events = [event async for event in agent.run("AAPL")]

    md_events = [e for e in events if e["agent"] == "market_data"]
    statuses = {e["status"] for e in md_events}
    assert "running" in statuses
    assert "complete" in statuses


@pytest.mark.asyncio
async def test_market_data_failure_stops_pipeline(agent: OrchestratorAgent) -> None:
    """Market Data failure should emit error event and stop — no downstream agents run."""
    with patch("backend.agents.orchestrator.MarketDataAgent") as MockMD, \
         patch("backend.agents.orchestrator.TechnicalAnalysisAgent") as MockTA, \
         patch("backend.agents.orchestrator.SentimentAgent") as MockSent, \
         patch("backend.agents.orchestrator.RecommendationAgent") as MockRec:
        MockMD.return_value.get_bars.side_effect = RuntimeError("Ticker 'BAD' was not found.")
        events = [event async for event in agent.run("BAD")]

    md_error = next((e for e in events if e["agent"] == "market_data" and e["status"] == "error"), None)
    assert md_error is not None
    assert "error" in md_error["result"]

    done_event = next((e for e in events if e["agent"] == "done"), None)
    assert done_event is not None
    assert done_event["status"] == "error"

    agent_names = [e["agent"] for e in events]
    assert "technical_analysis" not in agent_names
    assert "sentiment" not in agent_names
    assert "recommendation" not in agent_names

    MockTA.return_value.analyze.assert_not_called()
    MockSent.return_value.analyze.assert_not_called()
    MockRec.return_value.analyze.assert_not_called()


@pytest.mark.asyncio
async def test_sentiment_failure_continues_to_recommendation(agent: OrchestratorAgent) -> None:
    """Sentiment failure should emit error event but pipeline continues to recommendation."""
    with patch("backend.agents.orchestrator.MarketDataAgent") as MockMD, \
         patch("backend.agents.orchestrator.TechnicalAnalysisAgent") as MockTA, \
         patch("backend.agents.orchestrator.SentimentAgent") as MockSent, \
         patch("backend.agents.orchestrator.RecommendationAgent") as MockRec, \
         patch("backend.agents.orchestrator.OrchestratorAgent._write_report", return_value="AAPL_test.json"):
        MockMD.return_value.get_bars.return_value = MOCK_BARS
        MockMD.return_value.get_snapshot.return_value = MOCK_SNAPSHOT
        MockTA.return_value.analyze.return_value = MOCK_SIGNALS
        MockSent.return_value.analyze.side_effect = RuntimeError("News service unavailable")
        MockRec.return_value.analyze.return_value = MOCK_RECOMMENDATION
        events = [event async for event in agent.run("AAPL")]

    sent_error = next((e for e in events if e["agent"] == "sentiment" and e["status"] == "error"), None)
    assert sent_error is not None
    assert "error" in sent_error["result"]

    agent_names = [e["agent"] for e in events]
    assert "recommendation" in agent_names

    done_event = next(e for e in events if e["agent"] == "done")
    assert done_event["status"] == "complete"


@pytest.mark.asyncio
async def test_recommendation_failure_still_completes_pipeline(agent: OrchestratorAgent) -> None:
    """Recommendation failure should emit error event but done/complete still fires."""
    with patch("backend.agents.orchestrator.MarketDataAgent") as MockMD, \
         patch("backend.agents.orchestrator.TechnicalAnalysisAgent") as MockTA, \
         patch("backend.agents.orchestrator.SentimentAgent") as MockSent, \
         patch("backend.agents.orchestrator.RecommendationAgent") as MockRec, \
         patch("backend.agents.orchestrator.OrchestratorAgent._write_report", return_value="AAPL_test.json"):
        MockMD.return_value.get_bars.return_value = MOCK_BARS
        MockMD.return_value.get_snapshot.return_value = MOCK_SNAPSHOT
        MockTA.return_value.analyze.return_value = MOCK_SIGNALS
        MockSent.return_value.analyze.return_value = MOCK_SENTIMENT
        MockRec.return_value.analyze.side_effect = RuntimeError("AI service error")
        events = [event async for event in agent.run("AAPL")]

    rec_error = next((e for e in events if e["agent"] == "recommendation" and e["status"] == "error"), None)
    assert rec_error is not None

    done_event = next(e for e in events if e["agent"] == "done")
    assert done_event["status"] == "complete"


@pytest.mark.asyncio
async def test_ta_non_value_error_continues_pipeline(agent: OrchestratorAgent) -> None:
    """Non-ValueError TA failure should behave same as ValueError — emit error, continue."""
    with patch("backend.agents.orchestrator.MarketDataAgent") as MockMD, \
         patch("backend.agents.orchestrator.TechnicalAnalysisAgent") as MockTA, \
         patch("backend.agents.orchestrator.SentimentAgent") as MockSent, \
         patch("backend.agents.orchestrator.RecommendationAgent") as MockRec, \
         patch("backend.agents.orchestrator.OrchestratorAgent._write_report", return_value="AAPL_test.json"):
        MockMD.return_value.get_bars.return_value = MOCK_BARS
        MockMD.return_value.get_snapshot.return_value = MOCK_SNAPSHOT
        MockTA.return_value.analyze.side_effect = RuntimeError("Pandas computation error")
        MockSent.return_value.analyze.return_value = MOCK_SENTIMENT
        MockRec.return_value.analyze.return_value = MOCK_RECOMMENDATION
        events = [event async for event in agent.run("AAPL")]

    ta_error = next((e for e in events if e["agent"] == "technical_analysis" and e["status"] == "error"), None)
    assert ta_error is not None

    agent_names = [e["agent"] for e in events]
    assert "sentiment" in agent_names
    assert "recommendation" in agent_names
    assert "done" in agent_names


@pytest.mark.asyncio
async def test_run_continues_after_insufficient_bars(agent: OrchestratorAgent) -> None:
    """Pipeline should not crash when TA raises ValueError; downstream agents still run."""
    with patch("backend.agents.orchestrator.MarketDataAgent") as MockMD, \
         patch("backend.agents.orchestrator.TechnicalAnalysisAgent") as MockTA, \
         patch("backend.agents.orchestrator.SentimentAgent") as MockSent, \
         patch("backend.agents.orchestrator.RecommendationAgent") as MockRec, \
         patch("backend.agents.orchestrator.OrchestratorAgent._write_report", return_value="X_test.json"):
        MockMD.return_value.get_bars.return_value = MOCK_BARS
        MockMD.return_value.get_snapshot.return_value = MOCK_SNAPSHOT
        MockTA.return_value.analyze.side_effect = ValueError("Need minimum 26 bars, got 4")
        MockSent.return_value.analyze.return_value = MOCK_SENTIMENT
        MockRec.return_value.analyze.return_value = MOCK_RECOMMENDATION

        events = [event async for event in agent.run("AAPY")]

    agent_names = [e["agent"] for e in events]
    ta_event = next(e for e in events if e["agent"] == "technical_analysis" and e["status"] == "error")
    assert "error" in ta_event["result"]
    assert "sentiment" in agent_names
    assert "recommendation" in agent_names
    assert "done" in agent_names

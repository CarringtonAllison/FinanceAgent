import json
import os
from collections.abc import AsyncGenerator
from datetime import datetime, timezone

from backend.agents.market_data import MarketDataAgent
from backend.agents.recommendation import RecommendationAgent
from backend.agents.sentiment import SentimentAgent
from backend.agents.technical_analysis import TechnicalAnalysisAgent

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")


class OrchestratorAgent:
    async def run(self, ticker: str) -> AsyncGenerator[dict, None]:
        ticker = ticker.upper()
        bars: list = []
        snapshot: dict = {}
        signals: dict = {}
        sentiment: dict = {}
        recommendation: dict = {}

        # --- Market Data — hard stop on failure ---
        yield {"agent": "market_data", "status": "running", "result": None}
        md_agent = MarketDataAgent()
        try:
            bars = md_agent.get_bars(ticker)
            snapshot = md_agent.get_snapshot(ticker)
            yield {"agent": "market_data", "status": "complete", "result": snapshot}
        except Exception as exc:
            yield {"agent": "market_data", "status": "error", "result": {"error": str(exc)}}
            yield {"agent": "done", "status": "error", "result": {"error": str(exc)}}
            return

        # --- Technical Analysis — fail-forward ---
        yield {"agent": "technical_analysis", "status": "running", "result": None}
        ta_agent = TechnicalAnalysisAgent()
        try:
            ta_result = ta_agent.analyze(bars)
            signals = ta_result.get("signals", {})
            yield {"agent": "technical_analysis", "status": "complete", "result": signals}
        except Exception as exc:
            yield {"agent": "technical_analysis", "status": "error", "result": {"error": str(exc)}}
            signals = {}

        # --- Sentiment — fail-forward ---
        yield {"agent": "sentiment", "status": "running", "result": None}
        sent_agent = SentimentAgent()
        try:
            sentiment = sent_agent.analyze(ticker)
            yield {"agent": "sentiment", "status": "complete", "result": sentiment}
        except Exception as exc:
            yield {"agent": "sentiment", "status": "error", "result": {"error": str(exc)}}
            sentiment = {}

        # --- Recommendation — fail-forward ---
        yield {"agent": "recommendation", "status": "running", "result": None}
        rec_agent = RecommendationAgent()
        try:
            recommendation = rec_agent.analyze(ticker, snapshot, signals, sentiment)
            yield {"agent": "recommendation", "status": "complete", "result": recommendation}
        except Exception as exc:
            yield {"agent": "recommendation", "status": "error", "result": {"error": str(exc)}}
            recommendation = {}

        # --- Write JSON Report (always runs if market data succeeded) ---
        full_result = {
            "ticker": ticker,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "market_data": snapshot,
            "technical_signals": signals,
            "sentiment": sentiment,
            "recommendation": recommendation,
        }
        report_filename = self._write_report(ticker, full_result)

        yield {
            "agent": "done",
            "status": "complete",
            "result": full_result,
            "report": report_filename,
        }

    def _write_report(self, ticker: str, data: dict) -> str:
        os.makedirs(REPORTS_DIR, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"{ticker}_{timestamp}.json"
        filepath = os.path.join(REPORTS_DIR, filename)
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)
        return filename

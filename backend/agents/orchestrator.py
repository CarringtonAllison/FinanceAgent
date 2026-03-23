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
        market_data: dict = {}
        signals: dict = {}
        sentiment: dict = {}
        recommendation: dict = {}

        # --- Market Data ---
        yield {"agent": "market_data", "status": "running", "result": None}
        md_agent = MarketDataAgent()
        bars = md_agent.get_bars(ticker)
        snapshot = md_agent.get_snapshot(ticker)
        market_data = {"bars": bars, "snapshot": snapshot}
        yield {"agent": "market_data", "status": "complete", "result": snapshot}

        # --- Technical Analysis ---
        yield {"agent": "technical_analysis", "status": "running", "result": None}
        ta_agent = TechnicalAnalysisAgent()
        ta_result = ta_agent.analyze(bars)
        signals = ta_result.get("signals", {})
        yield {"agent": "technical_analysis", "status": "complete", "result": signals}

        # --- Sentiment ---
        yield {"agent": "sentiment", "status": "running", "result": None}
        sent_agent = SentimentAgent()
        sentiment = sent_agent.analyze(ticker)
        yield {"agent": "sentiment", "status": "complete", "result": sentiment}

        # --- Recommendation ---
        yield {"agent": "recommendation", "status": "running", "result": None}
        rec_agent = RecommendationAgent()
        recommendation = rec_agent.analyze(ticker, snapshot, signals, sentiment)
        yield {"agent": "recommendation", "status": "complete", "result": recommendation}

        # --- Write JSON Report ---
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

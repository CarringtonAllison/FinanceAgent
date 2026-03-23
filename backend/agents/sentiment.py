import json
import os

import anthropic
from newsapi import NewsApiClient


class SentimentAgent:
    def analyze(self, ticker: str) -> dict:
        news_api_key = os.getenv("NEWS_API_KEY")
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

        if not news_api_key or not anthropic_api_key:
            return {"score": "neutral", "confidence": 0.0, "headlines": [], "reasoning": "API keys not configured."}

        headlines = self._fetch_headlines(ticker, news_api_key)

        if not headlines:
            return {"score": "neutral", "confidence": 0.0, "headlines": [], "reasoning": "No recent news found."}

        return self._score_with_claude(headlines, anthropic_api_key)

    def _fetch_headlines(self, ticker: str, api_key: str) -> list[str]:
        client = NewsApiClient(api_key=api_key)
        response = client.get_everything(q=ticker, language="en", sort_by="publishedAt", page_size=10)
        articles = response.get("articles", [])
        return [a["title"] for a in articles if a.get("title")][:10]

    def _score_with_claude(self, headlines: list[str], api_key: str) -> dict:
        client = anthropic.Anthropic(api_key=api_key)
        headlines_text = "\n".join(f"- {h}" for h in headlines)

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            system=(
                "You are a financial sentiment analyst. "
                "Given a list of stock news headlines, respond ONLY with valid JSON in this exact format: "
                '{"score": "bullish" | "neutral" | "bearish", "confidence": <float 0.0-1.0>, "reasoning": "<one sentence>"}'
            ),
            messages=[{"role": "user", "content": f"Headlines:\n{headlines_text}"}],
        )

        raw = message.content[0].text.strip()
        parsed: dict = json.loads(raw)

        return {
            "score": parsed.get("score", "neutral"),
            "confidence": float(parsed.get("confidence", 0.0)),
            "headlines": headlines,
            "reasoning": parsed.get("reasoning", ""),
        }

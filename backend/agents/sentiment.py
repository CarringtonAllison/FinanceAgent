import json
import os

import anthropic
from newsapi import NewsApiClient

from backend.agents.retry import retry_sync


class SentimentAgent:
    def analyze(self, ticker: str) -> dict:
        news_api_key = os.getenv("NEWS_API_KEY")
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

        if not news_api_key or not anthropic_api_key:
            return {
                "score": "neutral",
                "confidence": 0.0,
                "headlines": [],
                "key_themes": [],
                "reasoning": "API keys not configured.",
            }

        articles = self._fetch_articles(ticker, news_api_key)

        if not articles:
            return {
                "score": "neutral",
                "confidence": 0.0,
                "headlines": [],
                "key_themes": [],
                "reasoning": "No recent news found.",
            }

        return self._score_with_claude(articles, anthropic_api_key)

    def _fetch_articles(self, ticker: str, api_key: str) -> list[dict]:
        client = NewsApiClient(api_key=api_key)
        try:
            response = retry_sync(lambda: client.get_everything(q=ticker, language="en", sort_by="publishedAt", page_size=10))
        except Exception as exc:
            raise RuntimeError("Could not fetch news headlines. The news service may be temporarily unavailable.") from exc
        articles = response.get("articles", [])
        return [
            {"title": a["title"], "url": a.get("url", "")}
            for a in articles
            if a.get("title")
        ][:10]

    def _score_with_claude(self, articles: list[dict], api_key: str) -> dict:
        client = anthropic.Anthropic(api_key=api_key)
        headlines_text = "\n".join(f"- {a['title']}" for a in articles)

        try:
            message = retry_sync(lambda: client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=512,
                system=(
                    "You are a financial sentiment analyst specializing in equities. "
                    "Given stock news headlines, perform a thorough sentiment analysis. "
                    "Identify the dominant market themes, assess how they affect the stock's near-term outlook, "
                    "and determine the overall sentiment. "
                    "Respond ONLY with valid JSON in this exact format: "
                    '{"score": "bullish" | "neutral" | "bearish", '
                    '"confidence": <float 0.0-1.0>, '
                    '"reasoning": "<2-3 sentence analysis of what the news means for the stock and its near-term price action>", '
                    '"key_themes": ["<theme 1>", "<theme 2>", ...]}'
                ),
                messages=[{"role": "user", "content": f"Headlines for analysis:\n{headlines_text}"}],
            ))
        except Exception as exc:
            raise RuntimeError("Sentiment analysis is unavailable. The AI service returned an error.") from exc

        raw = message.content[0].text.strip()
        # Strip markdown code fences if Claude wrapped the JSON
        if raw.startswith("```"):
            raw = "\n".join(
                line for line in raw.splitlines()
                if not line.startswith("```")
            ).strip()

        try:
            parsed: dict = json.loads(raw)
        except json.JSONDecodeError:
            return {
                "score": "neutral",
                "confidence": 0.0,
                "headlines": articles,
                "key_themes": [],
                "reasoning": "Could not parse sentiment response.",
            }

        return {
            "score": parsed.get("score", "neutral"),
            "confidence": float(parsed.get("confidence", 0.0)),
            "headlines": articles,
            "key_themes": parsed.get("key_themes", []),
            "reasoning": parsed.get("reasoning", ""),
        }

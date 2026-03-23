import json
import os

import anthropic


class RecommendationAgent:
    def analyze(
        self,
        ticker: str,
        market_data: dict,
        technical_signals: dict,
        sentiment: dict,
    ) -> dict:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set.")

        client = anthropic.Anthropic(api_key=api_key)

        prompt = (
            f"Ticker: {ticker}\n\n"
            f"Market Data:\n"
            f"  Price: ${market_data.get('price')}\n"
            f"  Volume: {market_data.get('volume')}\n\n"
            f"Technical Signals:\n"
            f"  RSI: {technical_signals.get('rsi')}\n"
            f"  MACD trend: {technical_signals.get('macd', {}).get('trend')}\n"
            f"  EMA crossover: {technical_signals.get('ema', {}).get('crossover')}\n"
            f"  Overall trend: {technical_signals.get('trend')}\n\n"
            f"Sentiment: {sentiment.get('score')} (confidence: {sentiment.get('confidence')})\n"
            f"Sentiment reasoning: {sentiment.get('reasoning')}\n"
        )

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=(
                "You are an expert day trading advisor. "
                "Given market data, technical analysis signals, and news sentiment for a stock, "
                "provide a trading recommendation. "
                "Respond ONLY with valid JSON in this exact format: "
                '{"action": "BUY" | "SELL" | "HOLD", "confidence": <float 0.0-1.0>, "reasoning": "<2-3 sentence explanation>"}'
            ),
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()
        parsed: dict = json.loads(raw)

        return {
            "action": parsed.get("action", "HOLD"),
            "confidence": float(parsed.get("confidence", 0.5)),
            "reasoning": parsed.get("reasoning", ""),
        }

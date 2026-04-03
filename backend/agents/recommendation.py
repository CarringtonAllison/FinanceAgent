import json
import os

import anthropic

from backend.agents.retry import retry_sync


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

        macd = technical_signals.get("macd", {})
        ema = technical_signals.get("ema", {})
        bollinger = technical_signals.get("bollinger", {})
        price = market_data.get("price")

        prompt = (
            f"Ticker: {ticker}\n\n"
            f"Current Market Data:\n"
            f"  Price: ${price}\n"
            f"  Volume: {market_data.get('volume')}\n\n"
            f"Technical Indicators:\n"
            f"  RSI (14): {technical_signals.get('rsi')} "
            f"({'overbought >70' if (technical_signals.get('rsi') or 0) > 70 else 'oversold <30' if (technical_signals.get('rsi') or 50) < 30 else 'neutral 30-70'})\n"
            f"  MACD value: {macd.get('value')}, signal: {macd.get('signal')}, "
            f"histogram: {macd.get('histogram')}, trend: {macd.get('trend')}\n"
            f"  EMA9: {ema.get('ema9')}, EMA21: {ema.get('ema21')}, crossover: {ema.get('crossover')}\n"
            f"  Bollinger Bands: upper={bollinger.get('upper')}, "
            f"middle={bollinger.get('middle')}, lower={bollinger.get('lower')}\n"
            f"  Overall trend: {technical_signals.get('trend')}\n\n"
            f"News Sentiment: {sentiment.get('score')} (confidence: {sentiment.get('confidence')})\n"
            f"Sentiment reasoning: {sentiment.get('reasoning')}\n"
            f"Key themes: {', '.join(sentiment.get('key_themes', []))}\n"
        )

        try:
            message = retry_sync(lambda: client.messages.create(
                model="claude-sonnet-4-6",
            max_tokens=1024,
            system=(
                "You are an expert equity analyst and day trading advisor. "
                "Given comprehensive market data, technical indicators, and news sentiment for a stock, "
                "provide a detailed trading recommendation that an investor can act on. "
                "Your analysis should:\n"
                "- Identify whether this is a buy, sell, or hold opportunity\n"
                "- Assess the risk level based on volatility signals and market conditions\n"
                "- Recommend a time horizon appropriate for the setup\n"
                "- Suggest concrete entry, stop-loss, and target price levels based on the technical data\n"
                "- List the specific factors driving the recommendation\n\n"
                "Respond ONLY with valid JSON in this exact format:\n"
                '{"action": "BUY" | "SELL" | "HOLD", '
                '"confidence": <float 0.0-1.0>, '
                '"reasoning": "<3-4 sentence explanation covering what the technicals and sentiment indicate, '
                'what has happened recently, and what is likely to happen next>", '
                '"key_factors": ["<factor 1>", "<factor 2>", "<factor 3>"], '
                '"risk_level": "low" | "medium" | "high", '
                '"time_horizon": "short" | "medium" | "long", '
                '"entry_price": <float or null>, '
                '"stop_loss": <float or null>, '
                '"target_price": <float or null>}'
            ),
                messages=[{"role": "user", "content": prompt}],
            ))
        except Exception as exc:
            raise RuntimeError("Recommendation is unavailable. The AI service returned an error.") from exc

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
                "action": "HOLD",
                "confidence": 0.5,
                "reasoning": "Could not parse recommendation response.",
                "key_factors": [],
                "risk_level": "medium",
                "time_horizon": "short",
                "entry_price": None,
                "stop_loss": None,
                "target_price": None,
            }

        entry = parsed.get("entry_price")
        stop = parsed.get("stop_loss")
        target = parsed.get("target_price")

        return {
            "action": parsed.get("action", "HOLD"),
            "confidence": float(parsed.get("confidence", 0.5)),
            "reasoning": parsed.get("reasoning", ""),
            "key_factors": parsed.get("key_factors", []),
            "risk_level": parsed.get("risk_level", "medium"),
            "time_horizon": parsed.get("time_horizon", "short"),
            "entry_price": float(entry) if entry is not None else None,
            "stop_loss": float(stop) if stop is not None else None,
            "target_price": float(target) if target is not None else None,
        }

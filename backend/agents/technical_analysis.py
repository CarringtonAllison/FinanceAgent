import pandas as pd
import ta.momentum
import ta.trend
import ta.volatility

MINIMUM_BARS = 26  # enough for MACD (26-period slow EMA)


class TechnicalAnalysisAgent:
    def analyze(self, bars: list[dict]) -> dict:
        if len(bars) < MINIMUM_BARS:
            raise ValueError(
                f"Not enough price history for technical analysis — need at least "
                f"{MINIMUM_BARS} 1-minute bars but only {len(bars)} are available. "
                f"This usually means the stock has very low trading volume today."
            )

        df = pd.DataFrame(bars)
        close = df["close"]

        rsi = self._calc_rsi(close)
        macd = self._calc_macd(close)
        ema = self._calc_ema(close)
        bollinger = self._calc_bollinger(close)
        trend = self._calc_trend(close)

        return {
            "signals": {
                "rsi": rsi,
                "macd": macd,
                "ema": ema,
                "bollinger": bollinger,
                "trend": trend,
            }
        }

    def _calc_rsi(self, close: pd.Series) -> float:
        indicator = ta.momentum.RSIIndicator(close=close, window=14)
        value = indicator.rsi().iloc[-1]
        return round(float(value), 2)

    def _calc_macd(self, close: pd.Series) -> dict:
        indicator = ta.trend.MACD(close=close)
        value = float(indicator.macd().iloc[-1])
        signal = float(indicator.macd_signal().iloc[-1])
        histogram = float(indicator.macd_diff().iloc[-1])

        if histogram > 0 and value > signal:
            trend = "bullish_crossover"
        elif histogram < 0 and value < signal:
            trend = "bearish_crossover"
        else:
            trend = "neutral"

        return {
            "value": round(value, 4),
            "signal": round(signal, 4),
            "histogram": round(histogram, 4),
            "trend": trend,
        }

    def _calc_ema(self, close: pd.Series) -> dict:
        ema9 = float(ta.trend.EMAIndicator(close=close, window=9).ema_indicator().iloc[-1])
        ema21 = float(ta.trend.EMAIndicator(close=close, window=21).ema_indicator().iloc[-1])

        if ema9 > ema21:
            crossover = "bullish"
        elif ema9 < ema21:
            crossover = "bearish"
        else:
            crossover = "neutral"

        return {
            "ema9": round(ema9, 4),
            "ema21": round(ema21, 4),
            "crossover": crossover,
        }

    def _calc_bollinger(self, close: pd.Series) -> dict:
        indicator = ta.volatility.BollingerBands(close=close)
        return {
            "upper": round(float(indicator.bollinger_hband().iloc[-1]), 4),
            "middle": round(float(indicator.bollinger_mavg().iloc[-1]), 4),
            "lower": round(float(indicator.bollinger_lband().iloc[-1]), 4),
        }

    def _calc_trend(self, close: pd.Series) -> str:
        ema21 = ta.trend.EMAIndicator(close=close, window=21).ema_indicator()
        recent = ema21.iloc[-1]
        prior = ema21.iloc[-6]
        diff = recent - prior
        if diff > 0.1:
            return "upward"
        elif diff < -0.1:
            return "downward"
        return "sideways"

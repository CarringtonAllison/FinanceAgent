import os
from collections.abc import AsyncGenerator

from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.live import StockDataStream
from alpaca.data.requests import StockBarsRequest, StockSnapshotRequest
from alpaca.data.timeframe import TimeFrame, TimeFrameUnit
from dotenv import load_dotenv

from backend.agents.retry import retry_sync

load_dotenv()


class MarketDataAgent:
    def __init__(self, api_key: str | None = None, secret_key: str | None = None) -> None:
        self._api_key = api_key or os.getenv("ALPACA_API_KEY", "")
        self._secret_key = secret_key or os.getenv("ALPACA_SECRET_KEY", "")
        self._client = StockHistoricalDataClient(self._api_key, self._secret_key)

    def get_bars(
        self,
        ticker: str,
        timeframe: str = "1Min",
        limit: int = 100,
    ) -> list[dict]:
        tf = self._parse_timeframe(timeframe)
        request = StockBarsRequest(symbol_or_symbols=ticker, timeframe=tf, limit=limit)
        try:
            response = retry_sync(lambda: self._client.get_stock_bars(request))
            bars = response[ticker]
        except KeyError:
            raise RuntimeError(f"Ticker '{ticker}' was not found. Please check the symbol.")
        except Exception as exc:
            raise RuntimeError(
                f"Could not fetch price data for {ticker}. The market data service may be temporarily unavailable."
            ) from exc
        return [
            {
                "time": int(bar.timestamp.timestamp()),
                "open": float(bar.open),
                "high": float(bar.high),
                "low": float(bar.low),
                "close": float(bar.close),
                "volume": float(bar.volume),
            }
            for bar in bars
        ]

    def get_snapshot(self, ticker: str) -> dict:
        request = StockSnapshotRequest(symbol_or_symbols=ticker)
        try:
            response = retry_sync(lambda: self._client.get_stock_snapshot(request))
            snap = response[ticker]
        except KeyError:
            raise RuntimeError(f"Ticker '{ticker}' was not found. Please check the symbol.")
        except Exception as exc:
            raise RuntimeError(
                f"Could not fetch snapshot for {ticker}. The market data service may be temporarily unavailable."
            ) from exc
        return {
            "ticker": ticker,
            "price": float(snap.latest_trade.price),
            "volume": float(snap.daily_bar.volume),
        }

    async def stream_bars(self, ticker: str) -> AsyncGenerator[dict, None]:
        import asyncio
        import threading

        buffer: list[dict] = []

        async def on_bar(bar: object) -> None:
            import alpaca.data.models as models
            if isinstance(bar, models.Bar):
                buffer.append(
                    {
                        "time": int(bar.timestamp.timestamp()),
                        "open": float(bar.open),
                        "high": float(bar.high),
                        "low": float(bar.low),
                        "close": float(bar.close),
                    }
                )

        stream = StockDataStream(self._api_key, self._secret_key)
        stream.subscribe_bars(on_bar, ticker)

        thread = threading.Thread(target=stream.run, daemon=True)
        thread.start()
        try:
            while True:
                if buffer:
                    yield buffer.pop(0)
                else:
                    await asyncio.sleep(0.5)
        finally:
            stream.stop()

    @staticmethod
    def _parse_timeframe(timeframe: str) -> TimeFrame:
        mapping: dict[str, TimeFrame] = {
            "1Min": TimeFrame(1, TimeFrameUnit.Minute),
            "5Min": TimeFrame(5, TimeFrameUnit.Minute),
            "15Min": TimeFrame(15, TimeFrameUnit.Minute),
            "1Hour": TimeFrame(1, TimeFrameUnit.Hour),
            "1Day": TimeFrame(1, TimeFrameUnit.Day),
        }
        return mapping.get(timeframe, TimeFrame(1, TimeFrameUnit.Minute))

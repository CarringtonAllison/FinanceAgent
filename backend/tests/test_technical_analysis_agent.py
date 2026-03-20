import pytest

from backend.agents.technical_analysis import TechnicalAnalysisAgent

# 30 bars of synthetic price data — enough for all indicators
MOCK_BARS = [
    {"time": 1700000000 + i * 60, "open": 210.0 + i * 0.2, "high": 211.0 + i * 0.2,
     "low": 209.0 + i * 0.2, "close": 210.5 + i * 0.2, "volume": 100000.0}
    for i in range(30)
]


@pytest.fixture
def agent() -> TechnicalAnalysisAgent:
    return TechnicalAnalysisAgent()


def test_analyze_returns_signals_key(agent: TechnicalAnalysisAgent) -> None:
    result = agent.analyze(MOCK_BARS)
    assert "signals" in result


def test_analyze_returns_rsi(agent: TechnicalAnalysisAgent) -> None:
    result = agent.analyze(MOCK_BARS)
    assert "rsi" in result["signals"]
    assert isinstance(result["signals"]["rsi"], float)


def test_analyze_returns_macd(agent: TechnicalAnalysisAgent) -> None:
    result = agent.analyze(MOCK_BARS)
    assert "macd" in result["signals"]
    macd = result["signals"]["macd"]
    assert {"value", "signal", "histogram", "trend"}.issubset(macd.keys())


def test_analyze_returns_ema(agent: TechnicalAnalysisAgent) -> None:
    result = agent.analyze(MOCK_BARS)
    assert "ema" in result["signals"]
    ema = result["signals"]["ema"]
    assert {"ema9", "ema21", "crossover"}.issubset(ema.keys())


def test_analyze_returns_bollinger(agent: TechnicalAnalysisAgent) -> None:
    result = agent.analyze(MOCK_BARS)
    assert "bollinger" in result["signals"]
    bb = result["signals"]["bollinger"]
    assert {"upper", "middle", "lower"}.issubset(bb.keys())


def test_analyze_returns_trend(agent: TechnicalAnalysisAgent) -> None:
    result = agent.analyze(MOCK_BARS)
    assert "trend" in result["signals"]
    assert result["signals"]["trend"] in ("upward", "downward", "sideways")


def test_analyze_requires_minimum_bars(agent: TechnicalAnalysisAgent) -> None:
    with pytest.raises(ValueError, match="minimum"):
        agent.analyze(MOCK_BARS[:5])

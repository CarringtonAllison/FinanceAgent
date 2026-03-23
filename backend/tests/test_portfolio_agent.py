from unittest.mock import patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.database import Base, Portfolio, Position, Trade, seed_portfolio
from backend.agents.portfolio import PortfolioAgent

MOCK_PRICE = 100.0


def make_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        session.add(Portfolio(cash_balance=1000.0, total_value=1000.0))
        session.commit()
    return Session(engine)


@pytest.fixture
def session() -> Session:
    return make_session()


@pytest.fixture
def agent() -> PortfolioAgent:
    return PortfolioAgent()


def patch_price(price: float = MOCK_PRICE):
    return patch(
        "backend.agents.portfolio.MarketDataAgent",
        **{"return_value.get_snapshot.return_value": {"ticker": "AAPL", "price": price, "volume": 0}},
    )


# --- BUY tests ---

def test_buy_creates_position(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 5.0)
    position = session.query(Position).filter_by(ticker="AAPL").first()
    assert position is not None
    assert position.shares == 5.0


def test_buy_sets_avg_cost(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 5.0)
    position = session.query(Position).filter_by(ticker="AAPL").first()
    assert position.avg_cost == 100.0


def test_buy_deducts_cash(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 5.0)
    portfolio = session.query(Portfolio).first()
    assert portfolio.cash_balance == pytest.approx(500.0)


def test_buy_updates_avg_cost_on_second_buy(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 4.0)
    with patch_price(200.0):
        agent.execute_trade(session, "AAPL", "BUY", 4.0)
    position = session.query(Position).filter_by(ticker="AAPL").first()
    # weighted avg: (100*4 + 200*4) / 8 = 150
    assert position.avg_cost == pytest.approx(150.0)
    assert position.shares == 8.0


def test_buy_raises_on_insufficient_cash(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(300.0):
        with pytest.raises(ValueError, match="insufficient cash"):
            agent.execute_trade(session, "AAPL", "BUY", 10.0)  # 3000 > 1000


def test_buy_records_trade(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 3.0)
    trade = session.query(Trade).filter_by(ticker="AAPL").first()
    assert trade is not None
    assert trade.action == "BUY"
    assert trade.shares == 3.0
    assert trade.price == 100.0
    assert trade.total == 300.0


# --- SELL tests ---

def test_sell_reduces_shares(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 5.0)
        agent.execute_trade(session, "AAPL", "SELL", 2.0)
    position = session.query(Position).filter_by(ticker="AAPL").first()
    assert position.shares == pytest.approx(3.0)


def test_sell_removes_position_when_fully_sold(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 5.0)
        agent.execute_trade(session, "AAPL", "SELL", 5.0)
    position = session.query(Position).filter_by(ticker="AAPL").first()
    assert position is None


def test_sell_adds_cash(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 5.0)
        agent.execute_trade(session, "AAPL", "SELL", 2.0)
    portfolio = session.query(Portfolio).first()
    # started 1000, bought 5@100=500, sold 2@100=200, remaining: 700
    assert portfolio.cash_balance == pytest.approx(700.0)


def test_sell_raises_on_no_position(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        with pytest.raises(ValueError, match="no position"):
            agent.execute_trade(session, "AAPL", "SELL", 1.0)


def test_sell_raises_on_insufficient_shares(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 3.0)
        with pytest.raises(ValueError, match="insufficient shares"):
            agent.execute_trade(session, "AAPL", "SELL", 5.0)


# --- Portfolio summary tests ---

def test_get_portfolio_summary_returns_positions_with_pnl(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 5.0)
    with patch_price(120.0):
        summary = agent.get_portfolio_summary(session)
    positions = summary["positions"]
    assert len(positions) == 1
    pos = positions[0]
    assert pos["ticker"] == "AAPL"
    assert pos["current_price"] == 120.0
    assert pos["unrealized_pnl"] == pytest.approx(100.0)  # (120-100)*5


def test_get_portfolio_summary_total_value_includes_positions(session: Session, agent: PortfolioAgent) -> None:
    with patch_price(100.0):
        agent.execute_trade(session, "AAPL", "BUY", 5.0)
    with patch_price(120.0):
        summary = agent.get_portfolio_summary(session)
    # cash=500, position=5*120=600, total=1100
    assert summary["total_value"] == pytest.approx(1100.0)
    assert summary["cash_balance"] == pytest.approx(500.0)

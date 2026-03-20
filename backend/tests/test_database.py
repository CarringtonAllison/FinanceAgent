import pytest
from sqlalchemy import inspect

from backend.database import engine, init_db


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_portfolio_table_exists():
    inspector = inspect(engine)
    assert "portfolio" in inspector.get_table_names()


def test_positions_table_exists():
    inspector = inspect(engine)
    assert "positions" in inspector.get_table_names()


def test_trades_table_exists():
    inspector = inspect(engine)
    assert "trades" in inspector.get_table_names()


def test_portfolio_has_required_columns():
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("portfolio")}
    assert {"id", "cash_balance", "total_value", "created_at", "updated_at"}.issubset(columns)


def test_positions_has_required_columns():
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("positions")}
    assert {"id", "ticker", "shares", "avg_cost", "created_at", "updated_at"}.issubset(columns)


def test_trades_has_required_columns():
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("trades")}
    assert {"id", "ticker", "action", "shares", "price", "total", "created_at"}.issubset(columns)

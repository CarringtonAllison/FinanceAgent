from contextlib import contextmanager
from typing import Generator

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.agents.portfolio import PortfolioAgent
from backend.database import Trade, engine

router = APIRouter(prefix="/portfolio")


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


class TradeRequest(BaseModel):
    ticker: str
    action: str
    shares: float


@router.get("")
def get_portfolio() -> dict:
    agent = PortfolioAgent()
    with get_db_session() as session:
        return agent.get_portfolio_summary(session)


@router.post("/trade")
def execute_trade(request: TradeRequest) -> dict:
    if request.shares <= 0:
        raise HTTPException(status_code=400, detail="shares must be greater than 0")
    agent = PortfolioAgent()
    with get_db_session() as session:
        try:
            trade = agent.execute_trade(session, request.ticker, request.action, request.shares)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        summary = agent.get_portfolio_summary(session)
        return {
            "trade": {
                "id": trade.id,
                "ticker": trade.ticker,
                "action": trade.action,
                "shares": trade.shares,
                "price": trade.price,
                "total": trade.total,
                "created_at": trade.created_at.isoformat(),
            },
            "portfolio": summary,
        }


@router.get("/trades")
def get_trades() -> dict:
    with get_db_session() as session:
        trades = session.query(Trade).order_by(Trade.created_at.desc()).all()
        return {
            "trades": [
                {
                    "id": t.id,
                    "ticker": t.ticker,
                    "action": t.action,
                    "shares": t.shares,
                    "price": t.price,
                    "total": t.total,
                    "created_at": t.created_at.isoformat(),
                }
                for t in trades
            ]
        }

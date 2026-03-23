from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend.agents.market_data import MarketDataAgent
from backend.database import Portfolio, Position, Trade


class PortfolioAgent:
    def execute_trade(self, session: Session, ticker: str, action: str, shares: float) -> Trade:
        ticker = ticker.upper()
        snapshot = MarketDataAgent().get_snapshot(ticker)
        price = snapshot["price"]
        total = price * shares

        portfolio = session.query(Portfolio).first()

        if action == "BUY":
            if portfolio.cash_balance < total:
                raise ValueError(
                    f"insufficient cash: need {total:.2f}, have {portfolio.cash_balance:.2f}"
                )
            position = session.query(Position).filter_by(ticker=ticker).first()
            if position:
                new_shares = position.shares + shares
                position.avg_cost = (position.avg_cost * position.shares + price * shares) / new_shares
                position.shares = new_shares
                position.updated_at = datetime.now(timezone.utc)
            else:
                session.add(Position(ticker=ticker, shares=shares, avg_cost=price))
            portfolio.cash_balance -= total

        elif action == "SELL":
            position = session.query(Position).filter_by(ticker=ticker).first()
            if not position:
                raise ValueError(f"no position in {ticker} to sell")
            if position.shares < shares:
                raise ValueError(
                    f"insufficient shares: need {shares}, have {position.shares}"
                )
            position.shares -= shares
            if position.shares == 0:
                session.delete(position)
            else:
                position.updated_at = datetime.now(timezone.utc)
            portfolio.cash_balance += total

        portfolio.updated_at = datetime.now(timezone.utc)
        trade = Trade(ticker=ticker, action=action, shares=shares, price=price, total=total)
        session.add(trade)
        session.commit()
        session.refresh(trade)
        return trade

    def get_portfolio_summary(self, session: Session) -> dict:
        portfolio = session.query(Portfolio).first()
        positions = session.query(Position).all()

        position_data = []
        positions_value = 0.0
        total_unrealized_pnl = 0.0

        for pos in positions:
            snapshot = MarketDataAgent().get_snapshot(pos.ticker)
            current_price = snapshot["price"]
            market_value = pos.shares * current_price
            unrealized_pnl = (current_price - pos.avg_cost) * pos.shares
            cost_basis = pos.avg_cost * pos.shares
            unrealized_pnl_pct = (unrealized_pnl / cost_basis * 100) if cost_basis else 0.0

            positions_value += market_value
            total_unrealized_pnl += unrealized_pnl

            position_data.append({
                "ticker": pos.ticker,
                "shares": pos.shares,
                "avg_cost": pos.avg_cost,
                "current_price": current_price,
                "market_value": market_value,
                "unrealized_pnl": unrealized_pnl,
                "unrealized_pnl_pct": unrealized_pnl_pct,
            })

        total_value = portfolio.cash_balance + positions_value
        portfolio.total_value = total_value
        portfolio.updated_at = datetime.now(timezone.utc)
        session.commit()

        return {
            "cash_balance": portfolio.cash_balance,
            "total_value": total_value,
            "positions": position_data,
            "total_unrealized_pnl": total_unrealized_pnl,
        }

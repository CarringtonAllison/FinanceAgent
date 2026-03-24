import os

from alpaca.trading.client import TradingClient
from alpaca.trading.enums import AssetClass, AssetStatus
from alpaca.trading.requests import GetAssetsRequest
from fastapi import APIRouter

router = APIRouter(prefix="/assets")

_asset_cache: list[dict] | None = None


def _load_assets() -> list[dict]:
    global _asset_cache
    if _asset_cache is not None:
        return _asset_cache
    client = TradingClient(
        api_key=os.getenv("ALPACA_API_KEY", ""),
        secret_key=os.getenv("ALPACA_SECRET_KEY", ""),
        paper=True,
    )
    request = GetAssetsRequest(
        asset_class=AssetClass.US_EQUITY,
        status=AssetStatus.ACTIVE,
    )
    assets = client.get_all_assets(request)
    _asset_cache = [
        {"symbol": a.symbol, "name": a.name or ""}
        for a in assets
        if a.tradable
    ]
    return _asset_cache


@router.get("/search")
def search_assets(q: str = "") -> list[dict]:
    if not q.strip():
        return []
    query = q.strip().upper()
    assets = _load_assets()
    matches = [a for a in assets if a["symbol"].startswith(query)]
    matches.sort(key=lambda a: (len(a["symbol"]), a["symbol"]))
    return matches[:8]

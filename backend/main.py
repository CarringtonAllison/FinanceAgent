import os
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from backend.database import init_db, seed_portfolio
from backend.routers.health import router as health_router
from backend.routers.market_data import router as market_data_router
from backend.routers.analysis import router as analysis_router
from backend.routers.orchestrate import router as orchestrate_router
from backend.routers.portfolio import router as portfolio_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    init_db()
    seed_portfolio()
    yield


app = FastAPI(title="Finance Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(market_data_router)
app.include_router(analysis_router)
app.include_router(orchestrate_router)
app.include_router(portfolio_router)

import asyncio
import json
import os

from fastapi import APIRouter
from fastapi.responses import FileResponse, StreamingResponse

from backend.agents.orchestrator import OrchestratorAgent, REPORTS_DIR

router = APIRouter(prefix="/orchestrate")


@router.get("/{ticker}/run")
async def run_orchestration(ticker: str) -> StreamingResponse:
    agent = OrchestratorAgent()

    async def event_generator():
        async for event in agent.run(ticker.upper()):
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/reports/{filename}")
async def download_report(filename: str) -> FileResponse:
    filepath = os.path.join(REPORTS_DIR, filename)
    return FileResponse(filepath, media_type="application/json", filename=filename)

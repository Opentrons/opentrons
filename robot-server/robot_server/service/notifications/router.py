from typing import List

from fastapi import APIRouter, Query
from starlette.websockets import WebSocket

router = APIRouter()


@router.websocket("/notifications/subscribe")
async def handle_subscribe(
        websocket: WebSocket,
        topic: List[str] = Query(...)):
    """Accept a websocket connection."""
    await websocket.accept()
    await websocket.send_json({
        "status": "subscribed",
        "topics":  topic})

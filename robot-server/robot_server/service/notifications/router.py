from typing import List

from fastapi import APIRouter, Query
from starlette.websockets import WebSocket
from robot_server.service.notifications import handle_subscriber

router = APIRouter()


@router.websocket("/notifications/subscribe")
async def handle_subscribe(websocket: WebSocket, topic: List[str] = Query(...)):
    """Accept a websocket connection."""
    await websocket.accept()
    await handle_subscriber.handle_socket(websocket, topic)

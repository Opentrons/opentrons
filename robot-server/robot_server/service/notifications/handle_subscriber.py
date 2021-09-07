"""Websocket subscriber handler functions."""
import asyncio
import logging
from asyncio import CancelledError
from typing import List

from starlette.websockets import WebSocket, WebSocketDisconnect

from notify_server.clients.serdes import TopicEvent
from notify_server.clients.subscriber import Subscriber, create

from robot_server.settings import get_settings

log = logging.getLogger(__name__)


async def handle_socket(websocket: WebSocket, topics: List[str]) -> None:
    """Handle a websocket connection."""
    subscriber = create(get_settings().notification_server_subscriber_address, topics)
    await asyncio.gather(
        receive(websocket, subscriber), route_events(websocket, subscriber)
    )


async def receive(websocket: WebSocket, subscriber: Subscriber) -> None:
    """Read data from websocket. Will exit on websocket disconnect."""
    try:
        while True:
            await websocket.receive_json()
    except WebSocketDisconnect:
        log.info("Websocket subscriber disconnected.")
        subscriber.close()


async def send(websocket: WebSocket, entry: TopicEvent) -> None:
    """Send entry to web socket."""
    await websocket.send_text(entry.json())


async def route_events(websocket: WebSocket, subscriber: Subscriber) -> None:
    """Route events from subscriber to websocket."""
    try:
        async for entry in subscriber:
            await send(websocket, entry)
    except CancelledError:
        log.exception("Connection to notify-server closed.")

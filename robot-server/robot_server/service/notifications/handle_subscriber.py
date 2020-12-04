"""Websocket subscriber handler functions."""

from dataclasses import asdict
from typing import List

from starlette.websockets import WebSocket

from notify_server.clients.queue_entry import QueueEntry
from notify_server.clients.subscriber import Subscriber, create

from robot_server.settings import get_settings


async def handle_socket(
        websocket: WebSocket,
        topics: List[str]) -> None:
    """Handle a websocket connection."""
    subscriber = create(
        get_settings().notification_server_subscriber_address,
        topics
    )
    await route_events(websocket, subscriber)


async def send(websocket: WebSocket, queue_entry: QueueEntry) -> None:
    """Send queue entry to web socket."""
    await websocket.send_json(asdict(queue_entry))


async def route_events(websocket: WebSocket, subscriber: Subscriber) -> None:
    """Route events from subscriber to websocket."""
    async for queue_entry in subscriber:
        await send(websocket, queue_entry)

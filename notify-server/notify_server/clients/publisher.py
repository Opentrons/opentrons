"""A publisher client."""
from __future__ import annotations

import logging
from asyncio import Future
from typing import Any

from notify_server.clients.serdes import to_frames
from notify_server.models.event import Event
from notify_server.network.connection import create_push, Connection

log = logging.getLogger(__name__)


def create(host_address: str) -> Publisher:
    """
    Construct a publisher.

    :param host_address: uri to connect to.
    """
    return Publisher(connection=create_push(host_address))


class Publisher:
    """Publisher class."""

    def __init__(self, connection: Connection) -> None:
        """Construct a Publisher."""
        self._connection = connection

    async def send(self, topic: str, event: Event) -> None:
        """Publish an event to a topic."""
        await self.send_nowait(topic=topic, event=event)

    def send_nowait(self, topic: str, event: Event) -> Future[Any]:
        """Publish an event to a topic without waiting for completion."""
        frames = to_frames(topic=topic, event=event)
        print(f'frames is {frames}')
        return self._connection.send_multipart(frames)

    def close(self) -> None:
        """Close the connection."""
        self._connection.close()

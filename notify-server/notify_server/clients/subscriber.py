"""Subscriber client."""
from __future__ import annotations

import logging
import typing

from notify_server.clients.serdes import TopicEvent, from_frames
from notify_server.network.connection import create_subscriber, Connection

log = logging.getLogger(__name__)


def create(host_address: str, topics: typing.Sequence[str]) -> Subscriber:
    """
    Create a subscriber.

    :param host_address: The server notify_server address
    :param topics: The topics to subscribe to.
    :return: A Subscriber instance.
    """
    return Subscriber(create_subscriber(host_address, topics))


class Subscriber:
    """Async Subscriber class."""

    def __init__(self, connection: Connection) -> None:
        """Construct."""
        self._connection = connection

    def close(self) -> None:
        """Stop the subscriber task."""
        self._connection.close()

    async def next_event(self) -> TopicEvent:
        """Get next event."""
        s = await self._connection.recv_multipart()
        return from_frames(s)

    def __aiter__(self) -> "Subscriber":
        """Create an async iterator."""
        return self

    async def __anext__(self) -> TopicEvent:
        """Get next event."""
        return await self.next_event()

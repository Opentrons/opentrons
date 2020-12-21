"""Subscriber client."""
from __future__ import annotations

import logging
import asyncio
import typing

from notify_server.clients.queue_entry import QueueEntry, MalformedFrames
from notify_server.network.connection import create_subscriber, Connection

log = logging.getLogger(__name__)


async def create(
        host_address: str,
        topics: typing.Sequence[str]) -> Subscriber:
    """
    Create a subscriber.

    :param host_address: The server notify_server address
    :param topics: The topics to subscribe to.
    :return: A _Subscriber instance.
    """
    return Subscriber(create_subscriber(host_address, topics))


class Subscriber:
    """Async Subscriber class."""

    def __init__(self,
                 connection: Connection) -> None:
        """Construct."""
        self._task = asyncio.create_task(self._read_task(connection))
        self._q: asyncio.Queue = asyncio.Queue()

    async def stop(self) -> None:
        """Stop the subscriber task."""
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass

    async def _process_frames(self, frames: typing.List[bytes]) -> None:
        """
        Extract topic and Event, then add to the read queue.

        Process raw frames returned from recv_multipart. Frame 0 is the topic
         and 1 is the Event object serialized as json.
        """
        try:
            queue_entry = QueueEntry.from_frames(frames)
            log.debug("Received event %s", queue_entry)
            await self._q.put(queue_entry)
        except MalformedFrames:
            log.exception("exception handling event %s", frames)

    async def _read_task(self,
                         connection: Connection) -> None:
        """Connect to address and subscribe to topics."""
        try:
            while True:
                s = await connection.recv_multipart()
                await self._process_frames(s)
        except asyncio.CancelledError:
            log.exception("Done")
        finally:
            connection.close()

    async def next_event(self) -> QueueEntry:
        """Get next event."""
        return typing.cast(QueueEntry, await self._q.get())

    def __aiter__(self) -> 'Subscriber':
        """Create an async iterator."""
        return self

    async def __anext__(self) -> QueueEntry:
        """Get next event."""
        return await self.next_event()

"""Subscriber client."""
from __future__ import annotations

import logging
import asyncio
import typing

import zmq  # type: ignore
from zmq.asyncio import Context  # type: ignore

from notify_server.clients.queue_entry import QueueEntry, MalformedFrames
from notify_server.models.event import Event

log = logging.getLogger(__name__)


def create(host_address: str,
           topics: typing.Sequence[str]) -> Subscriber:
    """
    Create a subscriber.

    :param host_address: The server notify_server address
    :param topics: The topics to subscribe to.
    :return: A _Subscriber instance.
    """
    return Subscriber(host_address, topics)


class Subscriber:
    def __init__(self,
                 host_address: str,
                 topics: typing.Sequence[str]) -> None:
        """Construct."""
        self._task = asyncio.create_task(self._read_task(host_address, topics))
        self._q: asyncio.Queue = asyncio.Queue()

    def stop(self) -> None:
        """Stop the subscriber task."""
        self._task.cancel()

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
                         address: str,
                         topics: typing.Sequence[str]) -> None:
        """Connect to address and subscribe to topics."""
        ctx = Context()
        sock = ctx.socket(zmq.SUB)

        log.info("Connecting to %s", topics)

        sock.connect(address)

        log.info("Subscribing to %s", topics)
        for t in topics:
            sock.setsockopt_string(zmq.SUBSCRIBE, t)

        while True:
            s = await sock.recv_multipart()
            await self._process_frames(s)

    async def next_event(self) -> QueueEntry:
        """Get next event."""
        return typing.cast(QueueEntry, await self._q.get())

    def __aiter__(self) -> 'Subscriber':
        """Create an async iterator."""
        return self

    async def __anext__(self) -> QueueEntry:
        """Get next event."""
        return await self.next_event()

"""A publisher client."""
import asyncio
import logging
from asyncio import Task, Queue
from dataclasses import dataclass
from typing import List

import zmq  # type: ignore
from zmq.asyncio import Context  # type: ignore

from notify_server.models.event import Event

log = logging.getLogger(__name__)


def create(host_address: str) -> '_Publisher':
    """
    Construct a publisher.

    :param host_address: uri to connect to.
    """
    queue: Queue = Queue()
    task = asyncio.create_task(_send_task(address=host_address, queue=queue))
    return _Publisher(task=task, queue=queue)


async def _send_task(address: str, queue: Queue) -> None:
    """Run asyncio task that reads from queue and publishes to server."""
    ctx = Context()
    sock = ctx.socket(zmq.PUSH)

    log.info("Publisher connecting to %s", address)

    sock.connect(address)

    while True:
        entry: _Entry = await queue.get()
        await sock.send_multipart(entry.to_frames())


@dataclass
class _Entry:
    """An entry in publisher send queue."""

    topic: str
    event: Event

    def to_frames(self) -> List[bytes]:
        """Create zmq frames from members."""
        return [
            bytes(v, 'utf-8') for v in (self.topic, self.event.json(),)
        ]


class _Publisher:
    """Async publisher class."""

    def __init__(self, task: Task, queue: Queue) -> None:
        """Construct a _Publisher."""
        self._task = task
        self._queue = queue

    async def send(self, topic: str, event: Event) -> None:
        """Publish an event to a topic."""
        await self._queue.put(_Entry(topic, event))

    def stop(self) -> None:
        """Stop the publisher task."""
        self._task.cancel()

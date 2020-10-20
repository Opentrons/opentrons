"""A publisher client."""
from __future__ import annotations

import asyncio
import logging
from asyncio import Task, Queue

import zmq  # type: ignore
from zmq.asyncio import Context  # type: ignore

from notify_server.clients.queue_entry import QueueEntry
from notify_server.models.event import Event

log = logging.getLogger(__name__)


def create(host_address: str) -> Publisher:
    """
    Construct a publisher.

    :param host_address: uri to connect to.
    """
    queue: Queue = Queue()
    task = asyncio.create_task(_send_task(address=host_address, queue=queue))
    return Publisher(task=task, queue=queue)


async def _send_task(address: str, queue: Queue) -> None:
    """Run asyncio task that reads from queue and publishes to server."""
    ctx = Context()
    sock = ctx.socket(zmq.PUSH)

    log.info("Publisher connecting to %s", address)

    sock.connect(address)

    while True:
        entry: QueueEntry = await queue.get()
        await sock.send_multipart(entry.to_frames())


class Publisher:
    """Async publisher class."""

    def __init__(self, task: Task, queue: Queue) -> None:
        """Construct a _Publisher."""
        self._task = task
        self._queue = queue

    async def send(self, topic: str, event: Event) -> None:
        """Publish an event to a topic."""
        await self._queue.put(QueueEntry(topic, event))

    def stop(self) -> None:
        """Stop the publisher task."""
        self._task.cancel()

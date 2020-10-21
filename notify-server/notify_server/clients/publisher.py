"""A publisher client."""
from __future__ import annotations

import asyncio
import logging
from asyncio import Task, Queue

from notify_server.clients.queue_entry import QueueEntry
from notify_server.models.event import Event
from notify_server.network.connection import create_push, Connection

log = logging.getLogger(__name__)


def create(host_address: str) -> Publisher:
    """
    Construct a publisher.

    :param host_address: uri to connect to.
    """
    queue: Queue = Queue()
    task = asyncio.create_task(_send_task(connection=create_push(host_address),
                                          queue=queue))
    return Publisher(task=task, queue=queue)


async def _send_task(connection: Connection, queue: Queue) -> None:
    """Run asyncio task that reads from queue and publishes to server."""
    try:
        while True:
            entry: QueueEntry = await queue.get()
            await connection.send_multipart(entry.to_frames())
    except asyncio.CancelledError:
        log.exception("Done")
    finally:
        connection.close()


class Publisher:
    """Async publisher class."""

    def __init__(self, task: Task, queue: Queue) -> None:
        """Construct a _Publisher."""
        self._task = task
        self._queue = queue

    async def send(self, topic: str, event: Event) -> None:
        """Publish an event to a topic."""
        await self._queue.put(QueueEntry(topic, event))

    async def stop(self) -> None:
        """Stop the publisher task."""
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass

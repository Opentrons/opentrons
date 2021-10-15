"""Server execution functions."""

import logging
import asyncio
from asyncio import Queue

from notify_server.network.connection import create_publisher, create_pull, Connection
from notify_server.settings import Settings

log = logging.getLogger(__name__)


async def _publisher_server_task(connection: Connection, queue: Queue) -> None:
    """
    Run a task that reads multipart messages: topic, data.

    This is the publisher server. Clients connect using zmq.PUSH pattern and
    send messages to topics. Each topic, data pair is enqueued in queue.

    :param connection: The network connection.
    :param queue: Queue for received messages.
    :return: None
    """
    try:
        while True:
            m = await connection.recv_multipart()
            log.debug("Event: %s", m)
            await queue.put(m)
    except asyncio.CancelledError:
        log.exception("Done")
    finally:
        connection.close()


async def _subscriber_server_task(connection: Connection, queue: Queue) -> None:
    """
    Run a task that publishes messages to subscribers.

    :param connection: The network connection.
    :param queue: The queue of multipart messages to send
    :return: None
    """
    try:
        while True:
            s = await queue.get()
            log.debug("Publishing: %s", s)
            await connection.send_multipart(s)
    except asyncio.CancelledError:
        log.exception("Done")
    finally:
        connection.close()


async def run(settings: Settings) -> None:
    """Run the server tasks. Will not return."""
    queue: Queue = Queue()

    subtask = asyncio.create_task(
        _subscriber_server_task(
            create_publisher(settings.subscriber_address.connection_string()), queue
        )
    )
    pubtask = asyncio.create_task(
        _publisher_server_task(
            create_pull(settings.publisher_address.connection_string()), queue
        )
    )
    await asyncio.gather(subtask, pubtask)

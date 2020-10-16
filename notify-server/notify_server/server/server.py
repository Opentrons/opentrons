"""Server execution functions."""

import logging
import asyncio
from asyncio import Queue

from zmq.asyncio import Context  # type: ignore
import zmq  # type: ignore

from notify_server.settings import Settings

log = logging.getLogger(__name__)


async def _publisher_server_task(address: str, queue: Queue) -> None:
    """
    Run a task that reads multipart messages: topic, data.

    This is the publisher server. Clients connect using zmq.PUSH pattern and
    send messages to topics. Each topic, data pair is enqueued in queue.

    :param address: The address to bind to.
    :param queue: Queue for received messages.
    :return: None
    """
    log.info("Entering publisher server: %s", address)

    ctx = Context()
    sock = ctx.socket(zmq.PULL)

    sock.bind(address)

    while True:
        m = await sock.recv_multipart()
        log.debug("Event: %s", m)
        await queue.put(m)


async def _subscriber_server_task(address: str, queue: Queue) -> None:
    """
    Run a task that publishes messages to subscribers.

    :param address: The address to bind to
    :param queue: The queue of multipart messages to send
    :return: None
    """
    log.info("Entering subscriber server: %s", address)

    ctx = Context()
    sock = ctx.socket(zmq.PUB)

    sock.bind(address)

    while True:
        s = await queue.get()
        log.debug("Publishing: %s", s)
        await sock.send_multipart(s)


async def run(settings: Settings) -> None:
    """Run the server tasks. Will not return."""
    queue: Queue = Queue()

    subtask = asyncio.create_task(
        _subscriber_server_task(
            settings.subscriber_address.connection_string(), queue
        )
    )
    pubtask = asyncio.create_task(
        _publisher_server_task(
            settings.publisher_address.connection_string(), queue
        )
    )
    await subtask
    await pubtask

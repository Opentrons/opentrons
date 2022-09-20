"""Server execution functions."""

import logging
import asyncio
from asyncio import Queue
from typing import Optional
from traceback import format_exception

from notify_server.network.connection import create_publisher, create_pull, Connection
from notify_server.settings import Settings

log = logging.getLogger(__name__)


async def _publisher_server_task(
    connection: Connection, queue: Queue, running_event: asyncio.Event
) -> None:
    """
    Run a task that reads multipart messages: topic, data.

    This is the publisher server. Clients connect using zmq.PUSH pattern and
    send messages to topics. Each topic, data pair is enqueued in queue.

    :param connection: The network connection.
    :param queue: Queue for received messages.
    :return: None
    """
    running_event.set()
    log.info('publisher ready')
    try:
        while True:
            print("pub loop")
            m = await connection.recv_multipart()
            print(f'received {m}')
            log.info("Event: %s", m)
            await queue.put(m)
    except asyncio.CancelledError:
        log.exception("Done")
    finally:
        print("pub done")
        connection.close()


async def _subscriber_server_task(
    connection: Connection, queue: Queue, running_event: asyncio.Event
) -> None:
    """
    Run a task that publishes messages to subscribers.

    :param connection: The network connection.
    :param queue: The queue of multipart messages to send
    :return: None
    """
    running_event.set()
    log.info('subscriber ready')
    try:
        while True:
            print('sub loop')
            s = await queue.get()
            log.info("Publishing: %s", s)
            await connection.send_multipart(s)
    except asyncio.CancelledError:
        log.exception("Done")
    finally:
        print('sub asplode')
        connection.close()


async def run(settings: Settings, running_event: Optional[asyncio.Event]) -> None:
    """Run the server tasks. Will not return."""
    queue: Queue = Queue()
    sub_event = asyncio.Event()
    pub_event = asyncio.Event()
    print(f'server: subscriber connection: {settings.subscriber_address.connection_string()}')
    print(f'server: publisher connection: {settings.publisher_address.connection_string()}')
    subtask = asyncio.create_task(
        _subscriber_server_task(
            create_publisher(settings.subscriber_address.connection_string()),
            queue,
            sub_event,
        )
    )
    pubtask = asyncio.create_task(
        _publisher_server_task(
            create_pull(settings.publisher_address.connection_string()),
            queue,
            pub_event,
        )
    )
    try:
        await asyncio.wait_for(asyncio.gather(sub_event.wait(), pub_event.wait()), 10.0)
    except asyncio.TimeoutError:
        try:
            pub_exc = pubtask.exception()
        except (asyncio.InvalidStateError, asyncio.CancelledError):
            pub_exc = None
        try:
            sub_exc = subtask.exception()
        except (asyncio.InvalidStateError, asyncio.CancelledError):
            sub_exc = None
        if pub_exc:
            log.exception(
                f"Server start failed with pub error: {format_exception(None, value=pub_exc, tb=None)}"
            )
        if sub_exc:
            log.exception(
                f"Server start failed with sub error: {format_exception(None, value=sub_exc, tb=None)}"
            )
        if not pub_exc and not sub_exc:
            log.exception("Server start failed for unknown reason")
        raise
    if running_event:
        running_event.set()
        log.info('server ready event set')
    log.info('server ready')
    await asyncio.gather(subtask, pubtask)

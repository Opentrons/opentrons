"""Subscriber client."""

import logging
import asyncio
import typing

import zmq  # type: ignore
from zmq.asyncio import Context  # type: ignore

from notify_server.models.event import Event

log = logging.getLogger(__name__)


CALLBACK_TYPE = typing.Callable[
    [str, Event],
    typing.Coroutine[typing.Any, typing.Any, None]]


def create(host_address: str,
           topics: typing.Sequence[str],
           callback: CALLBACK_TYPE) -> '_Subscriber':
    """
    Create a subscriber.

    :param host_address: The server notify_server address
    :param topics: The topics to subscribe to.
    :param callback: A callback function called when new events arrive.
    :return: A _Subscriber instance.
    """
    return _Subscriber(host_address, topics, callback)


class _Subscriber:
    def __init__(self,
                 host_address: str,
                 topics: typing.Sequence[str],
                 callback: CALLBACK_TYPE) -> None:
        """Construct."""
        self._task = asyncio.create_task(self._read_task(host_address, topics))
        self._cb = callback

    def stop(self) -> None:
        """Stop the subscriber task."""
        self._task.cancel()

    async def _process_frames(self, frames: typing.List[bytes]) -> None:
        """
        Extract topic and Event, then call callback.

        Process raw frames returned from recv_multipart. Frame 0 is the topic
         and 1 is the Event object serialized as json.
        """
        try:
            topic = frames[0].decode()
            event = Event.parse_raw((frames[1]))
            log.debug("Topic %s received event %s", topic, frames)
            await self._cb(topic, event)
        except (ValueError, IndexError, AttributeError):
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

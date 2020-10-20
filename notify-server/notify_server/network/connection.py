"""Connection module."""
from __future__ import annotations

import logging
from typing import List, Any, Sequence

import zmq  # type: ignore
from zmq.asyncio import Context  # type: ignore
from zmq.asyncio import Socket


log = logging.getLogger(__name__)


def create_pull(address: str) -> Connection:
    """Create a PULL server connection."""
    ctx = Context()
    sock = ctx.socket(zmq.PULL)

    log.info("Puller binding to %s", address)
    sock.bind(address)

    return Connection(sock)


def create_push(address: str) -> Connection:
    """Create a PUSH client connection."""
    ctx = Context()
    sock = ctx.socket(zmq.PUSH)

    log.info("Pusher connecting to %s", address)
    sock.connect(address)

    return Connection(sock)


def create_publisher(address: str) -> Connection:
    """Create a PUB client connection."""
    ctx = Context()
    sock = ctx.socket(zmq.PUB)

    log.info("Publisher binding to %s", address)
    sock.bind(address)

    return Connection(sock)


def create_subscriber(address: str, topics: Sequence[str]) -> Connection:
    """Create a SUB client connection."""
    ctx = Context()
    sock = ctx.socket(zmq.SUB)

    log.info("Subscriber connecting to %s", address)
    sock.connect(address)

    log.info("Subscribing to %s", topics)
    for t in topics:
        sock.setsockopt_string(zmq.SUBSCRIBE, t)

    return Connection(sock)


class Connection:
    """Wrapper for a connected zmq socket."""

    def __init__(self, socket: Socket) -> None:
        """Construct."""
        self._socket = socket

    async def send_multipart(self, frames: List[bytes]) -> None:
        """Send a multipart message."""
        await self._socket.send_multipart(frames)

    async def recv_multipart(self) -> Any:
        """Recv a multipart message."""
        return await self._socket.recv_multipart()

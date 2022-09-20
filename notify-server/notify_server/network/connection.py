"""Connection module."""
from __future__ import annotations

import logging
from asyncio import Future
from typing import List, Any, Sequence

import zmq  # type: ignore
from zmq.asyncio import Context  # type: ignore
from zmq.asyncio import Socket


log = logging.getLogger(__name__)


def create_pull(address: str) -> Connection:
    """Create a PULL server connection."""
    ctx = Context.instance()
    sock = ctx.socket(zmq.PULL)

    log.info("Puller binding to %s", address)
    sock.bind(address)

    return Connection(sock)


def create_push(address: str) -> Connection:
    """Create a PUSH client connection."""
    ctx = Context.instance()
    sock = ctx.socket(zmq.PUSH)

    log.info("Pusher connecting to %s", address)
    sock.connect(address)

    return Connection(sock)


def create_publisher(address: str) -> Connection:
    """Create a PUB client connection."""
    ctx = Context.instance()
    sock = ctx.socket(zmq.PUB)

    log.info("Publisher binding to %s", address)
    sock.bind(address)

    return Connection(sock)


def create_subscriber(address: str, topics: Sequence[str]) -> Connection:
    """Create a SUB client connection."""
    ctx = Context.instance()
    sock = ctx.socket(zmq.SUB)

    log.info("Subscriber connecting to %s", address)
    sock.connect(address)

    log.info("Subscribing to %s", topics)
    for t in topics:
        sock.subscribe(t)

    return Connection(sock)


class Connection:
    """Wrapper for a connected zmq socket."""

    def __init__(self, socket: Socket) -> None:
        """Construct."""
        self._socket = socket

    def send_multipart(self, frames: List[bytes]) -> Future[Any]:
        """Send a multipart message."""
        # Type ignore is due to zmq not providing type annotation.
        print("socket send here")
        return self._socket.send_multipart(frames)  # type: ignore

    def recv_multipart(self) -> Future[Any]:
        """Recv a multipart message."""
        # Type ignore is due to zmq not providing type annotation.
        return self._socket.recv_multipart()  # type: ignore

    def close(self) -> None:
        """Close the socket."""
        log.debug("Closing socket")
        self._socket.close()

"""Module to talk to other processes using json-rpc over async sockets."""

from .dispatcher import JSONRPCDispatcher
from .manager import JSONRPCResponseManager
from .messenger import IPCMessenger
from .constants import (
    IPCProcess,
    Destinations,
    DESTINATION_PORT,
)


ipc_dispatcher = JSONRPCDispatcher()


__all__ = [
    "ipc_dispatcher",
    "JSONRPCDispatcher",
    "JSONRPCResponseManager",
    "IPCMessenger",
    "IPCProcess",
    "Destinations",
    "DESTINATION_PORT",
]

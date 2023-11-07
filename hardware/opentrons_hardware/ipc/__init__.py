"""Module to talk to other processes using json-rpc over async sockets."""

from .dispatcher import JSONRPCDispatcher
from .manager import JSONRPCResponseManager
from .messenger import IPCMessenger
from .types import (
    IPCProcess,
    DESTINATION_PORT,
    JSONRPCRequest,
    JSONRPCResponse,
)
from .errors import (
    JSONRPCError,
    ErrorCodes,
)


ipc_dispatcher = JSONRPCDispatcher()


__all__ = [
    "ipc_dispatcher",
    "JSONRPCDispatcher",
    "JSONRPCResponseManager",
    "IPCMessenger",
    "IPCProcess",
    "DESTINATION_PORT",
    "JSONRPCRequest",
    "JSONRPCResponse",
    "JSONRPCError",
    "ErrorCodes",
]

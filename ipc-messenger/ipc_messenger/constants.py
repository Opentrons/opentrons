from enum import Enum
from typing import Any, Dict, List, Optional

from jsonrpc import JSONRPCResponseManager, dispatcher
from jsonrpc.jsonrpc2 import JSONRPC20Request, JSONRPC20Response
from jsonrpc.exceptions import (
    JSONRPCInvalidRequest,
    JSONRPCInvalidRequestException,
)


class JSONRPCRequest(JSONRPC20Request):
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: id={self._id} method={self.method} params={self.params}>"


class JSONRPCResponse(JSONRPC20Response):
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: id={self._id} result={self.result}>"


class IPCProcess(Enum):
    """IPCProcesses we can talk to over ipc."""
    HARDWARE = "hardware"
    ROBOT_SERVER = "robot_server"
    SYSTEM_SERVER = "system_server"


DESTINATION_PORT = {
    IPCProcess.HARDWARE: 4000,
    IPCProcess.ROBOT_SERVER: 4001,
    IPCProcess.SYSTEM_SERVER: 4002,
}

Destinations = List[IPCProcess]

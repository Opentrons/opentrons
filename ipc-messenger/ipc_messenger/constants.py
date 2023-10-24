from enum import Enum
from typing import Any, Dict, List, Optional

from jsonrpc import JSONRPCResponseManager, dispatcher
from jsonrpc.jsonrpc2 import JSONRPC20Request, JSONRPC20Response
from jsonrpc.exceptions import (
    JSONRPCInvalidRequest,
    JSONRPCInvalidRequestException,
)

class Destination(Enum):
    HARDWARE = "hardware"
    ROBOT_SERVER = "robot_server"
    SYSTEM_SERVER = "system_server"


DESTINATION_PORT = {
    Destination.HARDWARE: 4000,
    Destination.ROBOT_SERVER: 4001,
    Destination.SYSTEM_SERVER: 4002,
}

Destinations = List[Destination]

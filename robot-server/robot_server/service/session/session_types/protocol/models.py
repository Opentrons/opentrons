from enum import Enum

from pydantic import BaseModel


class ProtocolSessionState(str, Enum):
    idle = "idle"
    preparing = "preparing"
    ready = "ready"
    running = "running"
    simulating = "simulating"
    failed = "failed"
    paused = "paused"
    exited = "exited"

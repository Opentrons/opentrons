"""Protocol engine module.

The protocol_engine module contains the logic necessary to take a stream of
protocol commands, issued by some arbitrary protocol runner, and turn it into
protocol state and side-effects like robot movements.
"""

from .create_protocol_engine import create_protocol_engine
from .protocol_engine import ProtocolEngine
from .errors import ProtocolEngineError, ErrorOccurance
from .commands import Command, CommandRequest, CommandStatus, CommandType
from .state import State, StateView
from .plugins import AbstractPlugin

from .types import (
    CalibrationOffset,
    DeckSlotLocation,
    Dimensions,
    EngineStatus,
    LabwareLocation,
    LoadedLabware,
    LoadedPipette,
    PipetteName,
    WellLocation,
    WellOrigin,
    WellOffset,
)

__all__ = [
    # main factory and interface exports
    "create_protocol_engine",
    "ProtocolEngine",
    # error types
    "ProtocolEngineError",
    "ErrorOccurance",
    # top level command unions and values
    "Command",
    "CommandRequest",
    "CommandStatus",
    "CommandType",
    # state interfaces and models
    "State",
    "StateView",
    # public value interfaces and models
    "CalibrationOffset",
    "DeckSlotLocation",
    "Dimensions",
    "EngineStatus",
    "LabwareLocation",
    "LoadedLabware",
    "LoadedPipette",
    "PipetteName",
    "WellLocation",
    "WellOrigin",
    "WellOffset",
    # plugins
    "AbstractPlugin",
]

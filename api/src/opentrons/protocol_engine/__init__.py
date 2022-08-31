"""Protocol engine module.

The protocol_engine module contains the logic necessary to take a stream of
protocol commands, issued by some arbitrary protocol runner, and turn it into
protocol state and side-effects like robot movements.
"""

from .create_protocol_engine import create_protocol_engine
from .protocol_engine import ProtocolEngine
from .errors import ProtocolEngineError, ErrorOccurrence
from .commands import (
    Command,
    CommandParams,
    CommandCreate,
    CommandStatus,
    CommandType,
    CommandIntent,
)
from .state import State, StateView, StateSummary, CommandSlice, CurrentCommand, Config
from .plugins import AbstractPlugin

from .types import (
    LabwareOffset,
    LabwareOffsetCreate,
    LabwareOffsetVector,
    LabwareOffsetLocation,
    DeckPoint,
    DeckSlotLocation,
    ModuleLocation,
    Dimensions,
    EngineStatus,
    LabwareLocation,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
    WellLocation,
    WellOrigin,
    WellOffset,
    ModuleModel,
    ModuleDefinition,
    Liquid,
)


__all__ = [
    # main factory and interface exports
    "create_protocol_engine",
    "ProtocolEngine",
    "StateSummary",
    "Config",
    # error types
    "ProtocolEngineError",
    "ErrorOccurrence",
    # top level command unions and values
    "Command",
    "CommandParams",
    "CommandCreate",
    "CommandStatus",
    "CommandType",
    "CommandIntent",
    # state interfaces and models
    "State",
    "StateView",
    "CommandSlice",
    "CurrentCommand",
    # public value interfaces and models
    "LabwareOffset",
    "LabwareOffsetCreate",
    "LabwareOffsetVector",
    "LabwareOffsetLocation",
    "DeckSlotLocation",
    "DeckPoint",
    "ModuleLocation",
    "Dimensions",
    "EngineStatus",
    "LabwareLocation",
    "LoadedLabware",
    "LoadedModule",
    "LoadedPipette",
    "WellLocation",
    "WellOrigin",
    "WellOffset",
    "ModuleModel",
    "ModuleDefinition",
    "Liquid",
    # plugins
    "AbstractPlugin",
]

"""Protocol engine module.

The protocol_engine module contains the logic necessary to take a stream of
protocol commands, issued by some arbitrary protocol runner, and turn it into
protocol state and side-effects like robot movements.

The main interface is the `ProtocolEngine` class.
"""

from .create_protocol_engine import (
    create_protocol_engine,
    create_protocol_engine_in_thread,
)
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
    LabwareMovementStrategy,
    DeckPoint,
    DeckType,
    DeckSlotLocation,
    ModuleLocation,
    OnLabwareLocation,
    OFF_DECK_LOCATION,
    Dimensions,
    EngineStatus,
    LabwareLocation,
    NonStackedLocation,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
    MotorAxis,
    WellLocation,
    DropTipWellLocation,
    WellOrigin,
    DropTipWellOrigin,
    WellOffset,
    ModuleModel,
    ModuleDefinition,
    Liquid,
)


__all__ = [
    # main factory and interface exports
    "create_protocol_engine",
    "create_protocol_engine_in_thread",
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
    "LabwareMovementStrategy",
    "DeckSlotLocation",
    "DeckPoint",
    "DeckType",
    "ModuleLocation",
    "OnLabwareLocation",
    "OFF_DECK_LOCATION",
    "Dimensions",
    "EngineStatus",
    "LabwareLocation",
    "NonStackedLocation",
    "LoadedLabware",
    "LoadedModule",
    "LoadedPipette",
    "MotorAxis",
    "WellLocation",
    "DropTipWellLocation",
    "WellOrigin",
    "DropTipWellOrigin",
    "WellOffset",
    "ModuleModel",
    "ModuleDefinition",
    "Liquid",
    # plugins
    "AbstractPlugin",
]

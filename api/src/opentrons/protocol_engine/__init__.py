"""Protocol engine module.

The protocol_engine module contains the logic necessary to take a stream of
protocol commands, issued by some arbitrary protocol runner, and turn it into
protocol state and side-effects like robot movements.

The main interface is the `ProtocolEngine` class.
"""

from .commands import (
    Command,
    CommandCreate,
    CommandIntent,
    CommandParams,
    CommandStatus,
    CommandType,
)
from .create_protocol_engine import (
    create_protocol_engine,
    create_protocol_engine_in_thread,
)
from .errors import ErrorOccurrence, ProtocolEngineError
from .notes import CommandNote
from .plugins import AbstractPlugin
from .protocol_engine import ProtocolEngine
from .state import CommandSlice, Config, CurrentCommand, State, StateSummary, StateView
from .types import (
    OFF_DECK_LOCATION,
    AddressableAreaLocation,
    AddressableOffsetVector,
    AllNozzleLayoutConfiguration,
    ColumnNozzleLayoutConfiguration,
    DeckPoint,
    DeckSlotLocation,
    DeckType,
    Dimensions,
    DropTipWellLocation,
    DropTipWellOrigin,
    EngineStatus,
    LabwareLocation,
    LabwareMovementStrategy,
    LabwareOffset,
    LabwareOffsetCreate,
    LabwareOffsetLocation,
    LabwareOffsetVector,
    Liquid,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
    ModuleDefinition,
    ModuleLocation,
    ModuleModel,
    MotorAxis,
    NonStackedLocation,
    OnLabwareLocation,
    QuadrantNozzleLayoutConfiguration,
    RowNozzleLayoutConfiguration,
    SingleNozzleLayoutConfiguration,
    WellLocation,
    WellOffset,
    WellOrigin,
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
    "CommandNote",
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
    "AddressableOffsetVector",
    "DeckSlotLocation",
    "DeckPoint",
    "DeckType",
    "ModuleLocation",
    "OnLabwareLocation",
    "AddressableAreaLocation",
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
    "AllNozzleLayoutConfiguration",
    "SingleNozzleLayoutConfiguration",
    "RowNozzleLayoutConfiguration",
    "ColumnNozzleLayoutConfiguration",
    "QuadrantNozzleLayoutConfiguration",
    # plugins
    "AbstractPlugin",
]

""" protocol_api: The user-facing API for OT2 protocols.

This package defines classes and functions for access through a protocol to
control the OT2.

"""
from opentrons.protocols.api_support.definitions import (
    MAX_SUPPORTED_VERSION,
    MIN_SUPPORTED_VERSION,
    MIN_SUPPORTED_VERSION_FOR_FLEX,
)

from .protocol_context import ProtocolContext
from .deck import Deck
from .instrument_context import InstrumentContext
from .labware import Labware, Well
from .module_contexts import (
    ModuleContext,
    ThermocyclerContext,
    MagneticModuleContext,
    TemperatureModuleContext,
    HeaterShakerContext,
    MagneticBlockContext,
    AbsorbanceReaderContext,
)
from .disposal_locations import TrashBin, WasteChute
from ._liquid import Liquid
from ._types import OFF_DECK
from ._nozzle_layout import (
    COLUMN,
    ALL,
)
from ._parameters import Parameters
from ._parameter_context import ParameterContext

from .create_protocol_context import (
    create_protocol_context,
    ProtocolEngineCoreRequiredError,
)

__all__ = [
    "MAX_SUPPORTED_VERSION",
    "MIN_SUPPORTED_VERSION",
    "MIN_SUPPORTED_VERSION_FOR_FLEX",
    "ProtocolContext",
    "Deck",
    "ModuleContext",
    "InstrumentContext",
    "TemperatureModuleContext",
    "MagneticModuleContext",
    "ThermocyclerContext",
    "HeaterShakerContext",
    "MagneticBlockContext",
    "AbsorbanceReaderContext",
    "ParameterContext",
    "Labware",
    "TrashBin",
    "WasteChute",
    "Well",
    "Liquid",
    "Parameters",
    "COLUMN",
    "ALL",
    "OFF_DECK",
    # For internal Opentrons use only:
    "create_protocol_context",
    "ProtocolEngineCoreRequiredError",
]

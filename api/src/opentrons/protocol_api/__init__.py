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
)
from ._liquid import Liquid
from ._types import OFF_DECK
from ._waste_chute import WasteChute
from ._nozzle_layout import (
    COLUMN,
    EMPTY,
)

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
    "Labware",
    "WasteChute",
    "Well",
    "Liquid",
    "COLUMN",
    "EMPTY",
    "OFF_DECK",
    # For internal Opentrons use only:
    "create_protocol_context",
    "ProtocolEngineCoreRequiredError",
]

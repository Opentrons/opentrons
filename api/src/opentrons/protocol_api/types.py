from typing import Any, Callable, Dict, TYPE_CHECKING, Union
from .labware import Labware
from .contexts import InstrumentContext, ProtocolContext, \
    MagneticModuleContext, TemperatureModuleContext, \
    ThermocyclerContext


if TYPE_CHECKING:
    from opentrons_shared_data.protocol.dev_types import (
        MoveToSlotParams, ModuleIDParams, MagneticModuleEngageParams,
        TemperatureParams, ThermocyclerSetTargetBlockParams,
        ThermocyclerRunProfileParams, StandardLiquidHandlingParams,
        BlowoutParams, TouchTipParams, PipetteAccessParams
    )

Instruments = Dict[str, InstrumentContext]

LoadedLabware = Dict[str, Labware]

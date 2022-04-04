"""Temperature module sub-state."""

from dataclasses import dataclass
from typing import NewType

from opentrons.protocol_engine.types import TemperatureModuleModel, ModuleModel

TemperatureModuleId = NewType("TemperatureModuleId", str)


@dataclass(frozen=True)
class TemperatureModuleSubState:
    """Temperature Module specific state.

    Provides calculations and read-only state access
    for an individual loaded Temperaute Module.
    """

    module_id: TemperatureModuleId
    model: TemperatureModuleModel

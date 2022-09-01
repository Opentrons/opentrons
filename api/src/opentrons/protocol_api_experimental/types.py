"""Python Protocol API v3 type definitions and value classes."""
from __future__ import annotations
from enum import Enum


from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons_shared_data.labware.dev_types import LabwareParameters

from opentrons.types import (
    DeckSlotName,
    Location,
    MountType as Mount,
    Mount as DeprecatedMount,
    Point,
)

from opentrons.protocol_engine import (
    DeckSlotLocation,
    ModuleLocation,
    ModuleModel,
)


class ModuleName(str, Enum):
    TEMPERATURE_MODULE = "temperature module"
    TEMPERATURE_MODULE_GEN2 = "temperature module gen2"
    MAGNETIC_MODULE = "magnetic module"
    MAGNETIC_MODULE_GEN2 = "magnetic module gen2"
    THERMOCYCLER_MODULE = "thermocycler module"
    THERMOCYCLER_MODULE_GEN2 = "thermocycler module gen2"

    @classmethod
    def to_model(cls, value: str) -> ModuleModel:
        if value == cls.TEMPERATURE_MODULE or value == "tempdeck":
            return ModuleModel.TEMPERATURE_MODULE_V1

        elif value == cls.TEMPERATURE_MODULE_GEN2:
            return ModuleModel.TEMPERATURE_MODULE_V2

        elif value == cls.MAGNETIC_MODULE or value == "magdeck":
            return ModuleModel.MAGNETIC_MODULE_V1

        elif value == cls.MAGNETIC_MODULE_GEN2:
            return ModuleModel.MAGNETIC_MODULE_V2

        elif value == cls.THERMOCYCLER_MODULE or value == "thermocycler":
            return ModuleModel.THERMOCYCLER_MODULE_V1

        elif value == cls.THERMOCYCLER_MODULE_GEN2:
            return ModuleModel.THERMOCYCLER_MODULE_V2

        else:
            return ModuleModel(value)


__all__ = [
    # re-exports from opentrons_shared_data.labware.dev_types
    "LabwareParameters",
    # re-exports from opentrons.types
    "DeckSlotName",
    "Location",
    "Mount",
    "DeprecatedMount",
    "Point",
    # re-exports from opentrons.protocol_engine
    "DeckSlotLocation",
    "ModuleLocation",
    "PipetteName",
    "ModuleModel",
]

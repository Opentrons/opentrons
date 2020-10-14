"""Protocol equipment state."""

from dataclasses import dataclass

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import Point

@dataclass
class LabwareState():
    labwareId: str
    definition: LabwareDefinition
    calibration: Point

class EquipmentState():
    pass

"""Protocol Engine types to do with moving labware."""

from pydantic import BaseModel

from opentrons_shared_data.util import StrEnum

from .labware_offset_vector import LabwareOffsetVector


class LabwareMovementStrategy(StrEnum):
    """Strategy to use for labware movement."""

    USING_GRIPPER = "usingGripper"
    MANUAL_MOVE_WITH_PAUSE = "manualMoveWithPause"
    MANUAL_MOVE_WITHOUT_PAUSE = "manualMoveWithoutPause"


class LabwareMovementOffsetData(BaseModel):
    """Offsets to be used during labware movement."""

    pickUpOffset: LabwareOffsetVector
    dropOffset: LabwareOffsetVector

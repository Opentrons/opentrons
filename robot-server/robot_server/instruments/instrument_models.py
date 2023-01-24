"""Request and response models for /instruments endpoints."""
from __future__ import annotations

import enum
from typing_extensions import Literal
from typing import Optional, TypeVar, Union, Generic
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
)
from opentrons.hardware_control.types import GripperJawState
from opentrons.types import Mount

from opentrons_shared_data.pipette.dev_types import (
    PipetteName,
    PipetteModel,
    ChannelCount,
)
from opentrons_shared_data.gripper.gripper_definition import GripperModel


InstrumentModelT = TypeVar("InstrumentModelT", bound=Union[GripperModel, PipetteModel])
InstrumentDataT = TypeVar("InstrumentDataT", bound=BaseModel)

InstrumentType = Literal["pipette", "gripper"]


# TODO (spp, 2023-01-03): use MountType from opentrons.types once it has extension type
class MountType(enum.Enum):
    """Available mount types."""

    LEFT = enum.auto()
    RIGHT = enum.auto()
    EXTENSION = enum.auto()

    @staticmethod
    def from_hw_mount(mount: Mount) -> MountType:
        """Convert from Mount to MountType."""
        mount_map = {Mount.LEFT: MountType.LEFT, Mount.RIGHT: MountType.RIGHT}
        return mount_map[mount]

    def as_string(self) -> str:
        """Get MountType as a string."""
        return self.name.lower()


class _GenericInstrument(GenericModel, Generic[InstrumentModelT, InstrumentDataT]):
    """Base instrument response."""

    mount: str = Field(..., description="The mount this instrument is attached to.")
    instrumentType: InstrumentType = Field(
        ..., description="Type of instrument- either a pipette or a gripper."
    )
    instrumentModel: InstrumentModelT = Field(..., description="Instrument model.")
    # TODO (spp, 2023-01-06): add firmware version field
    serialNumber: str = Field(..., description="Instrument hardware serial number.")
    data: InstrumentDataT


class GripperData(BaseModel):
    """Data from attached gripper."""

    jawState: GripperJawState = Field(..., description="Gripper Jaw state.")
    # TODO (spp, 2023-01-03): update calibration field as decided after
    #  spike https://opentrons.atlassian.net/browse/RSS-167
    calibratedOffset: Optional[GripperCalibrationOffset] = Field(
        None, description="Calibrated gripper offset."
    )


class PipetteData(BaseModel):
    """Data from attached pipette."""

    channels: ChannelCount = Field(..., description="Number of pipette channels.")
    min_volume: float = Field(..., description="Minimum pipette volume.")
    max_volume: float = Field(..., description="Maximum pipette volume.")
    # TODO (spp, 2022-12-20): update/ add fields according to client needs.
    #  add calibration data as decided by https://opentrons.atlassian.net/browse/RSS-167


class Pipette(_GenericInstrument[PipetteModel, PipetteData]):
    """Attached pipette info & configuration."""

    instrumentType: Literal["pipette"] = "pipette"
    instrumentName: PipetteName
    instrumentModel: PipetteModel
    data: PipetteData


class Gripper(_GenericInstrument[GripperModel, GripperData]):
    """Attached gripper info & configuration."""

    instrumentType: Literal["gripper"] = "gripper"
    instrumentModel: GripperModel
    data: GripperData


AttachedInstrument = Union[Pipette, Gripper]

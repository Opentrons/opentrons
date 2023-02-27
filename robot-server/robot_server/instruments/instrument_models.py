"""Request and response models for /instruments endpoints."""
from __future__ import annotations

import enum
from typing_extensions import Literal
from typing import Optional, TypeVar, Union, Generic
from datetime import datetime
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel


from opentrons.types import Mount
from opentrons.calibration_storage.types import SourceType
from opentrons.hardware_control.types import OT3Mount
from opentrons.protocol_engine.types import Vec3f
from opentrons_shared_data.pipette.dev_types import (
    PipetteName,
    PipetteModel,
    ChannelCount,
)
from opentrons_shared_data.gripper.gripper_definition import GripperModelStr
from robot_server.service.json_api import ResourceLink

InstrumentModelT = TypeVar(
    "InstrumentModelT", bound=Union[GripperModelStr, PipetteModel]
)
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

    @staticmethod
    def to_ot3_mount(mount: MountTypesStr) -> OT3Mount:
        """Convert from MountType to OT3Mount."""
        mount_map = {
            "left": OT3Mount.LEFT,
            "right": OT3Mount.RIGHT,
            "extension": OT3Mount.GRIPPER,
        }
        return mount_map[mount]

    @staticmethod
    def from_ot3_mount(mount: OT3Mount) -> MountType:
        """Convert from OT3Mount to MountType."""
        mount_map = {
            OT3Mount.LEFT: MountType.LEFT,
            OT3Mount.RIGHT: MountType.RIGHT,
            OT3Mount.GRIPPER: MountType.EXTENSION,
        }
        return mount_map[mount]

    def as_string(self) -> str:
        """Get MountType as a string."""
        return self.name.lower()


MountTypesStr = Literal["left", "right", "extension"]


class _GenericInstrument(GenericModel, Generic[InstrumentModelT, InstrumentDataT]):
    """Base instrument response."""

    mount: str = Field(..., description="The mount this instrument is attached to.")
    instrumentType: InstrumentType = Field(
        ..., description="Type of instrument- either a pipette or a gripper."
    )
    instrumentModel: InstrumentModelT = Field(..., description="Instrument model.")
    # TODO (spp, 2023-01-06): add firmware version field
    serialNumber: str = Field(..., description="Instrument hardware serial number.")
    firmwareUpdateRequired: bool = Field(
        ..., description="Whether the instrument requires a firmware update."
    )
    data: InstrumentDataT


class GripperCalibrationData(BaseModel):
    """A gripper's calibration data."""

    offset: Vec3f
    source: SourceType
    last_modified: Optional[datetime] = None


class GripperData(BaseModel):
    """Data from attached gripper."""

    jawState: str = Field(..., description="Gripper Jaw state.")
    # TODO (spp, 2023-01-03): update calibration field as decided after
    #  spike https://opentrons.atlassian.net/browse/RSS-167
    calibratedOffset: Optional[GripperCalibrationData] = Field(
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


class Gripper(_GenericInstrument[GripperModelStr, GripperData]):
    """Attached gripper info & configuration."""

    instrumentType: Literal["gripper"] = "gripper"
    instrumentModel: GripperModelStr
    data: GripperData


AttachedInstrument = Union[Pipette, Gripper]


class UpdateRequestModel(BaseModel):
    """Request data for updating instruments."""

    mount: MountTypesStr = Field(None, description="Mount of the instrument to update.")


class UpdateProgressStatus(BaseModel):
    """Model for status of firmware update progress."""

    mount: MountTypesStr = Field(..., description="The mount that is being updated.")
    updateStatus: str = Field(
        ..., description="Whether an update is queued, in progress or completed. "
    )
    updateProgress: int = Field(
        ..., description="Progress of the update depicted as an integer from 0 to 100."
    )


class UpdateStatusLink(BaseModel):
    """Link returned for monitoring firmware update status."""

    updateStatus: ResourceLink = Field(
        ..., description="Path to update status monitor."
    )

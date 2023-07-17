"""Request and response models for /instruments endpoints."""
from __future__ import annotations

from typing_extensions import Literal
from typing import Optional, TypeVar, Union, Generic
from datetime import datetime
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel


from opentrons.calibration_storage.types import SourceType
from opentrons.protocol_engine.types import Vec3f
from opentrons_shared_data.pipette.dev_types import (
    PipetteName,
    PipetteModel,
    ChannelCount,
)
from opentrons_shared_data.gripper.gripper_definition import GripperModelStr
from robot_server.subsystems.models import SubSystem

InstrumentModelT = TypeVar(
    "InstrumentModelT", bound=Union[GripperModelStr, PipetteModel]
)
InstrumentDataT = TypeVar("InstrumentDataT", bound=BaseModel)

InstrumentType = Literal["pipette", "gripper"]


class _GenericInstrument(GenericModel, Generic[InstrumentModelT, InstrumentDataT]):
    """Base instrument response."""

    mount: str = Field(..., description="The mount this instrument is attached to.")
    instrumentType: InstrumentType = Field(
        ..., description="Type of instrument- either a pipette or a gripper."
    )
    instrumentModel: InstrumentModelT = Field(..., description="Instrument model.")
    serialNumber: str = Field(..., description="Instrument hardware serial number.")
    subsystem: Optional[SubSystem] = Field(
        None,
        description="The subsystem corresponding to this instrument.",
    )
    ok: Literal[True] = Field(
        ..., description="Whether this instrument is OK and ready to go"
    )
    firmwareVersion: Optional[str] = Field(
        None, description="The firmware version of this instrument (if applicable)"
    )
    data: InstrumentDataT


class InstrumentCalibrationData(BaseModel):
    """An instrument's calibration data."""

    offset: Vec3f
    source: SourceType
    last_modified: Optional[datetime] = None


class GripperData(BaseModel):
    """Data from attached gripper."""

    jawState: str = Field(..., description="Gripper Jaw state.")
    # TODO (spp, 2023-01-03): update calibration field as decided after
    #  spike https://opentrons.atlassian.net/browse/RSS-167
    calibratedOffset: Optional[InstrumentCalibrationData] = Field(
        None, description="Calibrated gripper offset."
    )


class PipetteData(BaseModel):
    """Data from attached pipette."""

    channels: ChannelCount = Field(..., description="Number of pipette channels.")
    min_volume: float = Field(..., description="Minimum pipette volume.")
    max_volume: float = Field(..., description="Maximum pipette volume.")
    calibratedOffset: Optional[InstrumentCalibrationData] = Field(
        None, description="Calibrated pipette offset."
    )

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


class _BadInstrument(BaseModel):
    """Represents something that is physically connected but broken in some way. Must be updated."""

    subsystem: SubSystem = Field(
        ..., description="The hardware subsystem for this instrument"
    )
    status: str = Field(
        ...,
        description="A route on this server to more information about the status of the hardware",
    )
    update: str = Field(
        ..., description="A route on this server to begin an update of the instrument"
    )
    ok: Literal[False] = Field(
        ...,
        description="If the instrument is not OK, a previous update was interrupted. It must be updated again.",
    )


class BadGripper(_BadInstrument):
    """Represents a gripper that is physically connected but not ready to operate."""

    instrumentType: Literal["gripper"] = "gripper"


class BadPipette(_BadInstrument):
    """Represents a pipette that is physically connected but not ready to operate."""

    instrumentType: Literal["pipette"] = "pipette"


AttachedItem = Union[Pipette, Gripper, BadPipette, BadGripper]

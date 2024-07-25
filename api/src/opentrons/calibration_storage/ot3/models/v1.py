import typing

from typing_extensions import Literal
from opentrons.hardware_control.modules.types import ModuleType
from opentrons.hardware_control.types import OT3Mount
from pydantic import BaseModel, Field, validator
from datetime import datetime

from opentrons_shared_data.pipette.types import LabwareUri

from opentrons.types import Point
from opentrons.calibration_storage import types


class CalibrationStatus(BaseModel):
    markedBad: bool = False
    source: typing.Optional[types.SourceType] = None
    markedAt: typing.Optional[datetime] = None


class TipLengthModel(BaseModel):
    tipLength: float = Field(..., description="Tip length data found from calibration.")
    lastModified: datetime = Field(
        ..., description="The last time this tip length was calibrated."
    )
    uri: typing.Union[LabwareUri, Literal[""]] = Field(
        ..., description="The tiprack URI associated with the tip length data."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )

    @validator("tipLength")
    def ensure_tip_length_positive(cls, tipLength: float) -> float:
        if tipLength < 0.0:
            raise ValueError("Tip Length must be a positive number")
        return tipLength

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}


class BeltCalibrationModel(BaseModel):
    attitude: types.AttitudeMatrix = Field(
        ..., description="Attitude matrix for belts found from calibration."
    )
    lastModified: datetime = Field(
        ..., description="The last time this deck was calibrated."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    pipetteCalibratedWith: typing.Optional[str] = Field(
        default=None, description="The pipette id used to calibrate the deck."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}


class InstrumentOffsetModel(BaseModel):
    offset: Point = Field(..., description="Instrument offset found from calibration.")
    lastModified: datetime = Field(
        ..., description="The last time this instrument was calibrated."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}


class ModuleOffsetModel(BaseModel):
    offset: Point = Field(..., description="Module offset found from calibration.")
    mount: OT3Mount = Field(..., description="The mount used to calibrate this module.")
    slot: str = Field(
        ...,
        description=("The slot this module was calibrated in."),
    )
    module: ModuleType = Field(..., description="The module type of this module.")
    module_id: str = Field(..., description="The unique id of this module.")
    instrument_id: str = Field(
        ...,
        description="The unique id of the instrument used to calibrate this module.",
    )
    lastModified: datetime = Field(
        ..., description="The last time this module was calibrated."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}

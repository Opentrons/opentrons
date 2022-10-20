import typing

from typing_extensions import Literal
from pydantic import BaseModel, Field, validator
from datetime import datetime

from opentrons_shared_data.pipette.dev_types import LabwareUri

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


class DeckCalibrationModel(BaseModel):
    attitude: types.AttitudeMatrix = Field(
        ..., description="Attitude matrix found from calibration."
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

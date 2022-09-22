import typing

from typing_extensions import Literal
from pydantic import BaseModel, Field, validator
from datetime import datetime
from dataclasses import dataclass

from opentrons_shared_data.pipette.dev_types import LabwareUri

from opentrons.calibration_storage import types


class CalibrationStatus(BaseModel):
    markedBad: bool = False
    source: typing.Optional[types.SourceType] = None
    markedAt: typing.Optional[datetime] = None


# Schemas used to store the data types
# TODO(lc 09-01-2022) We should ensure that all pydantic models are
# in camel case, but for now, the schemas are following the format
# they are currently saved in on the OT-2 to avoid a large migration.
class TipLengthSchema(BaseModel):
    tipLength: float = Field(..., description="Tip length data found from calibration.")
    lastModified: datetime = Field(
        ..., description="The last time this tip length was calibrated."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )
    uri: typing.Union[LabwareUri, Literal[""]] = Field(
        ..., description="The tiprack URI associated with the tip length data."
    )

    @validator("uri")
    def uri_is_valid(cls, uri: LabwareUri):
        return uri

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}


class DeckCalibrationSchema(BaseModel):
    attitude: types.AttitudeMatrix = Field(
        ..., description="Attitude matrix found from calibration."
    )
    last_modified: datetime = Field(
        ..., description="The last time this deck was calibrated."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    pipette_calibrated_with: typing.Optional[str] = Field(
        default=None, description="The pipette id used to calibrate the deck."
    )
    tiprack: typing.Optional[str] = Field(
        default=None, description="The tiprack id used to calibrate the deck."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )


    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}


class InstrumentOffsetSchema(BaseModel):
    offset: types.InstrumentCalOffset = Field(
        ..., description="Instrument offset found from calibration."
    )
    tiprack: str = Field(..., description="Tiprack used to calibrate this offset")
    uri: str = Field(
        ..., description="The URI of the labware used for instrument offset"
    )
    last_modified: datetime = Field(
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


# TODO(lc 09-19-2022) We need to refactor the calibration endpoints
# so that we only need to use one data model schema. This model is a
# temporary workaround to match with current behavior.
class PipetteOffsetCalibration(BaseModel):
    pipette: str = Field(..., description="Pipette id associated with calibration.")
    mount: str = Field(
        ..., description="The mount that this pipette was calibrated with."
    )
    offset: types.InstrumentCalOffset = Field(
        ..., description="Instrument offset found from calibration."
    )
    tiprack: str = Field(..., description="Tiprack used to calibrate this offset")
    uri: str = Field(
        ..., description="The URI of the labware used for instrument offset"
    )
    last_modified: datetime = Field(
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


# TODO(lc 09-19-2022) We need to refactor the calibration endpoints
# so that we only need to use one data model schema. This model is a
# temporary workaround to match with current behavior.
class TipLengthCalibration(BaseModel):
    tipLength: float = Field(..., description="Tip length data found from calibration.")
    lastModified: datetime = Field(
        ..., description="The last time this tip length was calibrated."
    )
    source: types.SourceType = Field(
        default=types.SourceType.factory, description="The source of calibration."
    )
    status: CalibrationStatus = Field(
        default_factory=CalibrationStatus,
        description="The status of the calibration data.",
    )
    uri: typing.Union[LabwareUri, Literal[""]] = Field(
        ..., description="The tiprack URI associated with the tip length data."
    )

    @validator("uri")
    def uri_is_valid(cls, uri: LabwareUri):
        return uri

    class Config:
        json_encoders = {datetime: lambda obj: obj.isoformat()}
        json_decoders = {datetime: lambda obj: datetime.fromisoformat(obj)}

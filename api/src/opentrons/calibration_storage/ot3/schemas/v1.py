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
    markedAt: typing.Optional[types.datetime] = None


class TipLengthSchema(BaseModel):
    tipLength: float = Field(..., description="Tip length data found from calibration.")
    lastModified: datetime = Field(..., description="The last time this tip length was calibrated.")
    source: types.SourceType = Field(default=types.SourceType.factory, description="The source of calibration.")
    status: CalibrationStatus = Field(default_factory=CalibrationStatus, description="The status of the calibration data.")
    uri: typing.Union[LabwareUri, Literal[""]] = Field(..., description="The tiprack URI associated with the tip length data.")

    class Config:
        json_encoders = {
            datetime: lambda obj: obj.isoformat()
        }
        json_decoders = {
            datetime: lambda obj: datetime.fromisoformat(obj)
        }



class DeckCalibrationSchema(BaseModel):
    attitude: types.AttitudeMatrix = Field(..., description="Attitude matrix found from calibration.")
    lastModified: datetime = Field(..., description="The last time this deck was calibrated.")
    source: types.SourceType = Field(default=types.SourceType.factory, description="The source of calibration.")
    pipetteCalibratedWith: typing.Optional[str] = Field(default=None, description="The pipette id used to calibrate the deck.")
    status: CalibrationStatus = Field(default_factory=CalibrationStatus, description="The status of the calibration data.")

    @validator('attitude')
    def attitude_is_valid(cls, attitude: types.AttitudeMatrix):
        return attitude

    class Config:
        json_encoders = {
            datetime: lambda obj: obj.isoformat()
        }
        json_decoders = {
            datetime: lambda obj: datetime.fromisoformat(obj)
        }


class InstrumentOffsetSchema(BaseModel):
    offset: types.InstrumentCalOffset = Field(..., description="Instrument offset found from calibration.")
    lastModified: datetime = Field(..., description="The last time this instrument was calibrated.")
    source: types.SourceType = Field(default=types.SourceType.factory, description="The source of calibration.")
    status: CalibrationStatus = Field(default_factory=CalibrationStatus, description="The status of the calibration data.")


    class Config:
        json_encoders = {
            datetime: lambda obj: obj.isoformat()
        }
        json_decoders = {
            datetime: lambda obj: datetime.fromisoformat(obj)
        }

# Dataclasses used in the hardware controller

@dataclass
class TipLengthCalibration:
    tip_length: float
    source: types.SourceType
    status: CalibrationStatus
    pipette: str
    tiprack: str
    last_modified: datetime
    uri: typing.Union[LabwareUri, Literal[""]]

import typing

from typing_extensions import Literal
from pydantic import BaseModel
from datetime import datetime

from opentrons_shared_data.pipette.dev_types import LabwareUri

from opentrons.calibration_storage import types


class CalibrationStatus(BaseModel):
    markedBad: bool = False
    source: typing.Optional[types.SourceType] = None
    markedAt: typing.Optional[types.datetime] = None


class TipLengthSchema(BaseModel):
    tipLength: float
    lastModified: datetime
    source: types.SourceType
    status: CalibrationStatus
    uri: typing.Union[LabwareUri, Literal[""]]


class DeckCalibrationSchema(BaseModel):
    attitude: types.AttitudeMatrix
    last_modified: datetime
    source: types.SourceType
    pipette_calibrated_with: typing.Optional[str]
    status: CalibrationStatus


class InstrumentOffsetSchema(BaseModel):
    offset: types.InstrumentCalOffset
    last_modified: datetime
    source: types.SourceType
    status: CalibrationStatus

import typing
import datetime

from functools import partial
from pydantic import BaseModel, Field


OffsetVector = typing.Tuple[float, float, float]

OffsetVectorField = partial(Field, ...,
                            description="A labware offset vector in deck "
                                        "coordinates (x, y, z)")


class OffsetData(BaseModel):
    value: OffsetVector = OffsetVectorField()
    lastModified: datetime


class TipData(BaseModel):
    value: float
    lastModified: datetime


class CalibrationData(BaseModel):
    offset: OffsetData
    tipLength: typing.Optional[TipData]


class LabwareCalibration(BaseModel):
    calibrationId: str
    calibrationData: CalibrationData
    loadName: str
    namespace: str
    version: int
    parent: str
    valueType: str


class Calibrations(BaseModel):
    valueType: str
    value: typing.List[typing.Optional[LabwareCalibration]]

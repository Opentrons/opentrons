import typing
from datetime import datetime

from functools import partial
from pydantic import BaseModel, Field

from robot_server.service.json_api import \
    ResponseDataModel, ResponseModel

OffsetVector = typing.Tuple[float, float, float]

OffsetVectorField = partial(Field, ...,
                            description="A labware offset vector in deck "
                                        "coordinates (x, y, z)")


class OffsetData(BaseModel):
    value: OffsetVector = OffsetVectorField()
    lastModified: datetime =\
        Field(..., description="When this calibration was last modified")


class TipData(BaseModel):
    """
    A model for tip length calibration data
    """
    value: typing.Optional[float] =\
        Field(..., description="The tip length of a labware")
    lastModified: typing.Optional[datetime] =\
        Field(..., description="When this calibration was last modified")


class CalibrationData(BaseModel):
    """
    A model for labware calibration data
    """
    offset: OffsetData = Field(..., description="An array of XYZ offset data.")
    tipLength: TipData =\
        Field(..., description="The tip length of a labware, if relevant.")


class LabwareCalibration(BaseModel):
    """
    A model describing labware calibrations (tiplength and offset)
    """
    calibrationData: CalibrationData =\
        Field(...,
              description="A dictionary of calibration data"
                          "including tip length and offsets")
    loadName: str =\
        Field(...,
              description="The loadname of the labware definition.")
    namespace: str =\
        Field(...,
              description="The namespace location of the labware definition")
    version: int = Field(..., description="The labware definition version")
    parent: str =\
        Field(...,
              description="The slot or module associated with this labware.")

    class Config:
        schema_extra = {
            "examples": [
                {
                    "calibrationData": {
                        "tipLength": {
                                "value"
                                "lastModified"
                            },
                        "offset": {
                                "value"
                                "lastModified"
                        }
                    },
                    "version": "1",
                    "parent": "3",
                    "namespace": "opentrons"

                }
            ]
        }


MultipleCalibrationsResponse = ResponseModel[
    typing.List[ResponseDataModel[LabwareCalibration]], dict
]


SingleCalibrationResponse = ResponseModel[
    ResponseDataModel[LabwareCalibration], dict
]

import typing
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from robot_server.service.json_api import ResponseModel
from robot_server.service.json_api.response import MultiResponseModel

OffsetVector = typing.Tuple[float, float, float]


class MountType(str, Enum):
    """Pipette mount type"""
    left = "left"
    right = "right"


class PipetteOffsetCalibration(BaseModel):
    """
    A model describing pipette calibration based on the mount and
    the pipette's serial number
    """
    pipette: str = \
        Field(..., descriiption="The pipette ID")
    mount: str = \
        Field(..., description="The pipette mount")
    offset: typing.List[float] = \
        Field(...,
              description="The pipette offset vector",
              max_items=3,
              min_items=3)
    tiprack: str = \
        Field(...,
              description="The sha256 hash of the tiprack used "
                          "in this calibration")
    lastModified: datetime = \
        Field(...,
              description="When this calibration was last modified")


MultipleCalibrationsResponse = MultiResponseModel[
    PipetteOffsetCalibration, dict
]


SingleCalibrationResponse = ResponseModel[
    PipetteOffsetCalibration, dict
]

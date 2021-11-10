import typing
from datetime import datetime
from enum import Enum

from pydantic import Field

from opentrons.calibration_storage.types import SourceType
from robot_server.service.json_api import (
    ResponseModel,
    MultiResponseModel,
    ResponseDataModel,
)
from robot_server.service.shared_models import calibration as cal_model

OffsetVector = typing.Tuple[float, float, float]


class MountType(str, Enum):
    """Pipette mount type"""

    left = "left"
    right = "right"


class PipetteOffsetCalibration(ResponseDataModel):
    """
    A model describing pipette calibration based on the mount and
    the pipette's serial number
    """

    pipette: str = Field(..., description="The pipette ID")
    mount: str = Field(..., description="The pipette mount")
    offset: typing.List[float] = Field(
        ..., description="The pipette offset vector", max_items=3, min_items=3
    )
    tiprack: str = Field(
        ..., description="The sha256 hash of the tiprack used " "in this calibration"
    )
    tiprackUri: str = Field(
        ...,
        description="The standard labware uri of the tiprack "
        "used in this calibration",
    )
    lastModified: datetime = Field(
        ..., description="When this calibration was last modified"
    )
    source: SourceType = Field(..., description="The calibration source")
    status: cal_model.CalibrationStatus = Field(
        ..., description="The status of this calibration"
    )


MultipleCalibrationsResponse = MultiResponseModel[PipetteOffsetCalibration, None]


SingleCalibrationResponse = ResponseModel[PipetteOffsetCalibration, None]

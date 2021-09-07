from datetime import datetime

from pydantic import Field

from opentrons.calibration_storage.types import SourceType
from robot_server.service.json_api import (
    ResponseModel,
    MultiResponseModel,
    ResponseDataModel,
)
from robot_server.service.shared_models import calibration as cal_model


class TipLengthCalibration(ResponseDataModel):
    """
    A model describing tip length calibration
    """

    tipLength: float = Field(..., description="The tip length value in mm")
    tiprack: str = Field(..., description="The sha256 hash of the tiprack")
    pipette: str = Field(..., description="The pipette ID")
    lastModified: datetime = Field(
        ..., description="When this calibration was last modified"
    )
    source: SourceType = Field(..., description="The calibration source")
    status: cal_model.CalibrationStatus = Field(
        ..., description="The status of this calibration"
    )
    uri: str = Field(..., description="The uri of the tiprack")


MultipleCalibrationsResponse = MultiResponseModel[TipLengthCalibration]

SingleCalibrationResponse = ResponseModel[TipLengthCalibration]

import typing
from pydantic import BaseModel, Field
from datetime import datetime

from opentrons.calibration_storage.types import SourceType


class CalibrationStatus(BaseModel):
    """
    A model describing whether a calibration on the robot is valid
    or not. This should be used for all calibration data models.
    """

    markedBad: bool = Field(..., description="Whether a calibration is invalid or not")
    source: typing.Optional[SourceType] = Field(
        None, description="The source that marked the calibration bad."
    )
    markedAt: typing.Optional[datetime] = Field(
        None, description="The time the calibration was marked bad."
    )

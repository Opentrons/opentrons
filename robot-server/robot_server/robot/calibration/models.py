from typing import Optional
from pydantic import BaseModel, Field


class SessionCreateParams(BaseModel):
    """
    The parameters required to start the following types of sessions;
    1. Tip Length Calibration
    2. Pipette Offset Calibration
    3. Tip Length Calibration + Pipette Offset Calibration
    """
    mount: str = Field(
        ...,
        description='The mount on which the pipette is attached, left or right'
    )
    hasCalibrationBlock: bool = Field(
        False,
        description='Whether to use a calibration block in the'
                    'instance of TLC + pipette offset flow'
    )
    tipRackDefinition: Optional[dict] = Field(
        None,
        description='The full labware definition of the tip rack to calibrate.'
    )
    shouldPerformTipLength: bool = Field(
        True,
        description='whether to perform TLC with the loaded tip rack,'
                    'prior to calibrating the pipette offset'
    )

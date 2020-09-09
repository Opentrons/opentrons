from typing import Optional, List
from pydantic import BaseModel, Field

from ..helper_classes import AttachedPipette, RequiredLabware, NextSteps


class SessionCreateParams(BaseModel):
    """
    The parameters required to start a pipette offset calibration session.
    """
    mount: str = Field(
        ...,
        description='The mount on which the pipette is attached, left or right'
    )


class PipetteOffsetCalibrationSessionStatus(BaseModel):
    """The current status of a pipette offset calibration session."""
    instrument: AttachedPipette
    currentStep: str = Field(
        ...,
        description="Current step of pipette offset user flow")
    labware: List[RequiredLabware]
    hasCalibratedTipLength: bool =\
        Field(None, description="Does tip length calibration data exist for "
                                "this pipette and tip rack combination")
    nextSteps: Optional[NextSteps] =\
        Field(None, description="Next Available Steps in Session")

    class Config:
        schema_extra = {
            "examples": [
                {
                    "instrument": {
                        "model": "p300_single_v1.5",
                        "name": "p300_single",
                        "tip_length": 51.7,
                        "mount": "left",
                        "serial": "P3HS12123041"
                    },
                    "currentStep": "sessionStarted",
                    "nextSteps": {
                        "links": {
                            "loadLabware": {"url": "", "params": {}}
                        }
                    },
                    "labware": [
                      {
                          "slot": "8",
                          "loadName": "tiprack_loadname",
                          "namespace": "opentrons",
                          "version": "1",
                          "isTiprack": "true",
                          "definition": {"ordering": "the ordering section..."}
                      },
                    ],
                    "hasCalibratedTipLength": True,
                }
            ]
        }

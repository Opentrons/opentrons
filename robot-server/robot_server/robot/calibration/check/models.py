from typing import Dict, Optional, List, Tuple
from functools import partial
from pydantic import BaseModel, Field

from ..helper_classes import NextSteps, RequiredLabware, AttachedPipette

OffsetVector = Tuple[float, float, float]

OffsetVectorField = partial(Field, ...,
                            description="An offset vector in deck "
                                        "coordinates (x, y, z)")


class SessionCreateParams(BaseModel):
    """
    The parameters required to start a calibration health session.
    """
    tipRacks: Optional[List[dict]] = Field(
        None,
        description='The full labware definition(s)'
                    'to use for calibration check.'
    )


class ComparisonStatus(BaseModel):
    """
    A model describing the comparison of a checked point to calibrated value
    """
    differenceVector: OffsetVector = OffsetVectorField()
    thresholdVector:  OffsetVector = OffsetVectorField()
    exceedsThreshold: bool
    transformType: str


class ComparisonMap(BaseModel):
    inspectingTip: Optional[ComparisonStatus] =\
        Field(None, description="tiprack validation step")
    comparingHeight: Optional[ComparisonStatus] =\
        Field(None, description="height validation step")
    comparingPointOne: Optional[ComparisonStatus] =\
        Field(None, description="point 1 validation step")
    comparingPointTwo: Optional[ComparisonStatus] =\
        Field(None, description="point 2 validation step")
    comparingPointThree: Optional[ComparisonStatus] =\
        Field(None, description="point 3 validation step")


class ComparisonStatePerPipette(BaseModel):
    first: ComparisonMap
    second: ComparisonMap


class CheckAttachedPipette(AttachedPipette):
    rank: str


class CalibrationCheckSessionStatus(BaseModel):
    """The current status of a given session."""
    instruments: List[CheckAttachedPipette]
    activePipette: CheckAttachedPipette
    currentStep: str = Field(..., description="Current step of session")
    comparisonsByStep: ComparisonStatePerPipette
    labware: List[RequiredLabware]

    class Config:
        arbitrary_types_allowed = True
        schema_extra = {
            "examples": [
                {
                    "instruments": {
                        "fakeUUID": {
                            "model": "p300_single_v1.5",
                            "name": "p300_single",
                            "tip_length": 51.7,
                            "mount": "left",
                            "id": "P3HS12123041"
                        },
                        "fakeUUID2": {
                            "model": None,
                            "name": None,
                            "tip_length": None,
                            "mount": "right",
                            "id": None
                        }
                    },
                    "currentStep": "sessionStarted",
                    "comparisonsByStep": {
                        "comparingFirstPipetteHeight": {
                            "differenceVector": [1, 0, 0],
                            "exceedsThreshold": False
                        }
                    },
                    "nextSteps": {
                        "links": {
                            "loadLabware": {"url": "", "params": {}}
                        }
                    }

                }
            ]
        }

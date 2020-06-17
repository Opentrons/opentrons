from uuid import UUID
from enum import Enum
from typing import Dict, Optional, List, Any, Tuple
from functools import partial
from pydantic import BaseModel, Field


OffsetVector = Tuple[float, float, float]

OffsetVectorField = partial(Field, ...,
                            description="An offset vector in deck "
                                        "coordinates (x, y, z)")


class TiprackPosition(BaseModel):
    locationId: UUID
    offset: OffsetVector = OffsetVectorField()


class SessionType(str, Enum):
    """The available session types"""
    null = 'null'
    default = 'default'
    calibration_check = 'calibrationCheck'
    tip_length_calibration = 'tipLengthCalibration'


class SpecificPipette(BaseModel):
    pipetteId: Optional[UUID] = Field(None)


class JogPosition(BaseModel):
    vector: OffsetVector


# TODO: BC: the mount and rank fields here are typed as strings
# because of serialization problems, though they are actually
# backed by enums. This shouldn't be the case, and we should
# be able to handle the de/serialization of these fields from
# the middle ware before they are returned to the client
class AttachedPipette(BaseModel):
    """Pipette (if any) attached to the mount"""
    model: Optional[str] =\
        Field(None,
              description="The model of the attached pipette. These are snake "
                          "case as in the Protocol API. This includes the full"
                          " version string")
    name: Optional[str] =\
        Field(None, description="Short name of pipette model without"
                                "generation version")
    tip_length: Optional[float] =\
        Field(None, description="The default tip length for this pipette")
    mount: Optional[str] =\
        Field(None, description="The mount this pipette attached to")
    has_tip: Optional[bool] =\
        Field(None, description="Whether a tip is attached.")
    tiprack_id: Optional[UUID] =\
        Field(None, description="Id of tiprack associated with this pipette.")
    rank: Optional[str] =\
        Field(None, description="Rank in the order of pipettes used for flow")
    serial: Optional[str] =\
        Field(None, description="The serial number of the attached pipette")


class LabwareStatus(BaseModel):
    """A model describing all tipracks required, based on pipettes attached."""
    alternatives: List[str]
    slot: Optional[str]
    id: UUID
    forMounts: List[str]
    loadName: str
    namespace: str
    version: str


class ComparisonStatus(BaseModel):
    """
    A model describing the comparison of a checked point to calibrated value
    """
    differenceVector: OffsetVector = OffsetVectorField()
    thresholdVector:  OffsetVector = OffsetVectorField()
    exceedsThreshold: bool
    transformType: str


class CalibrationSessionStatus(BaseModel):
    """The current status of a given session."""
    instruments: Dict[str, AttachedPipette]
    currentStep: str = Field(..., description="Current step of session")
    comparisonsByStep: Dict[str, ComparisonStatus]
    nextSteps: Optional[Dict[str, Dict[str, Dict[str, Any]]]] =\
        Field(None, description="Next Available Step in Session")
    labware: List[LabwareStatus]

    class Config:
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

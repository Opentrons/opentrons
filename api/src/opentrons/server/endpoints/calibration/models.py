from uuid import UUID
from enum import Enum
from typing import Dict, Optional, List, Any
from functools import partial
from pydantic import BaseModel, Field
from opentrons.types import Mount

from .helper_classes import DeckCalibrationError


Point = List[float]

# Commonly used Point type description and constraints
PointField = partial(Field, ...,
                     description="A point in deck coordinates (x, y, z)",
                     min_items=3, max_items=3)


class TiprackPosition(BaseModel):
    locationId: UUID
    offset: Point = PointField()


class SessionType(str, Enum):
    """The available session types"""
    check = 'check'


class SpecificPipette(BaseModel):
    pipetteId: Optional[UUID] = Field(None)


class JogPosition(BaseModel):
    vector: Point = PointField()


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
    mount: Optional[Mount] =\
        Field(None, description="The mount this pipette attached to")
    has_tip: Optional[bool] =\
        Field(None, description="Whether a tip is attached.")
    tiprack_id: Optional[UUID] =\
        Field(None, description="Id of tiprack associated with this pipette.")


class LabwareStatus(BaseModel):
    """A model describing all tipracks required, based on pipettes attached."""
    alternatives: List[str]
    slot: Optional[str]
    id: UUID
    forPipettes: List[UUID]
    loadName: str
    namespace: str
    version: str


class ComparisonStatus(BaseModel):
    """
    A model describing the comparison of a checked point to calibrated value
    """
    differenceVector: Point = PointField()
    thresholdVector:  Point = PointField()
    exceedsThreshold: bool
    transformType: DeckCalibrationError


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

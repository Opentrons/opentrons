from typing import Dict, Optional, List, Union
from enum import Enum
from uuid import UUID
from pydantic import BaseModel, Field

from opentrons.hardware_control.types import Axis

from robot_server.service.models.control import PointField, Point


class SessionType(str, Enum):
    """The available session types"""
    check = 'check'


class SpecificPipette(BaseModel):
    pipetteId: UUID


class JogPosition(SpecificPipette):
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
    mount_axis: Optional[Axis] =\
        Field(None, description="The axis that moves this pipette up and down")
    plunger_axis: Optional[Axis] =\
        Field(None, description="The axis that moves plunger of this pipette")
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


class CalibrationSessionStatus(BaseModel):
    """The current status of a given session."""
    instruments: Dict[str, AttachedPipette]
    currentStep: str = Field(..., description="Current step of session")
    labware: List[LabwareStatus]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "instruments": {
                        "fakeUUID4": {
                            "model": "p300_single_v1.5",
                            "name": "p300_single",
                            "tip_length": 51.7,
                            "mount_axis": "z",
                            "plunger_axis": "b",
                            "id": "P3HS12123041"
                        },
                        "fakeUUID2": {
                            "model": None,
                            "name": None,
                            "tip_length": None,
                            "mount_axis": "a",
                            "plunger_axis": "c",
                            "id": None
                        }
                    },
                    "currentStep": "sessionStart",
                    "nextSteps": {
                        "links": {
                            "loadLabware": {"url": "", "params": {}}
                        }
                    }

                }
            ]
        }

from typing import Dict, Optional
from pydantic import BaseModel, Field, UUID4

from opentrons.hardware_control.types import Axis


def convert_uuid(obj: UUID4):
    return obj.hex


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
    pipette_id: Optional[str] =\
        Field(None, description="The serial number of the attached pipette")

    class Config:
        json_encoders = {
            Axis: str,
            UUID4: convert_uuid}


class LabwareStatus(BaseModel):
    """
    A model describing all labware attached
    """
    alternatives: List[str]
    slot: DeckItem
    tiprackID: UUID4
    forPipettes: List[UUID4]
    loadName: str
    namespace: str
    version: int

    class Config:
        json_encoders = {
            UUID4: convert_uuid,
            DeckItem}


class CalibrationSessionStatus(BaseModel):
    """
    The current status of a given session.
    """
    instruments: Dict[str, AttachedPipette]
    currentStep: str = Field(..., description="Current step of session")
    nextSteps: Dict[str, Dict[str, str]] =\
        Field(..., description="Next Available Step in Session")
    sessionToken: UUID4 = Field(..., description="Session token")
    labware: List[LabwareStatus]

    class Config:
        json_encoders = {UUID4: convert_uuid}
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
                            "loadLabware": ""
                        }
                    },
                    "sessionToken": "FakeUUIDHex"

                }
            ]
        }

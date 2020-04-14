from typing import Dict, Optional, List, Any, Union
from functools import partial
from pydantic import BaseModel, Field, UUID4
from uuid import UUID

from opentrons.hardware_control.types import Axis


def convert_from_uuid(obj: UUID4):
    return obj.hex


def convert_to_uuid(obj: str):
    return UUID(obj)


Point = List[float]

# Commonly used Point type description and constraints
PointField = partial(Field, ...,
                     description="A point in deck coordinates (x, y, z)",
                     min_items=3, max_items=3)


class TiprackPosition(BaseModel):
    locationId: UUID4
    offset: Point = PointField()

    class Config:
        json_encoders = {
            UUID4: convert_to_uuid}


class DeckPosition(BaseModel):
    locationId: UUID4
    position: Point = PointField()

    class Config:
        json_encoders = {
            UUID4: convert_to_uuid}


class SpecificPipette(BaseModel):
    pipetteId: UUID4

    class Config:
        json_encoders = {
            UUID4: convert_to_uuid}


class MoveLocation(BaseModel):
    pipetteId: UUID4
    location: Union[TiprackPosition, DeckPosition]

    class Config:
        json_encoders = {
            UUID4: convert_to_uuid}


class JogPosition(BaseModel):
    pipetteId: UUID4
    vector: Point = PointField()

    class Config:
        json_encoders = {
            UUID4: convert_to_uuid}


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
    tiprack_id: Optional[UUID4] =\
        Field(None, description="Id of tiprack associated with this pip.")

    class Config:
        json_encoders = {
            Axis: str,
            UUID4: convert_from_uuid}


class LabwareStatus(BaseModel):
    """
    A model describing all tipracks required, based on pipettes attached.
    """
    alternatives: List[str]
    slot: Optional[str]
    id: UUID4
    forPipettes: List[UUID4]
    loadName: str
    namespace: str
    version: int

    class Config:
        json_encoders = {
            UUID4: convert_from_uuid}


class CalibrationSessionStatus(BaseModel):
    """
    The current status of a given session.
    """
    instruments: Dict[str, AttachedPipette]
    currentStep: str = Field(..., description="Current step of session")
    nextSteps: Dict[str, Dict[str, Dict[str, Any]]] =\
        Field(..., description="Next Available Step in Session")
    labware: List[LabwareStatus]

    class Config:
        json_encoders = {UUID4: convert_from_uuid}
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

from typing import Dict, Optional, List, Any
from pydantic import BaseModel, Field


# TODO: BC: the mount field here is typed as a string
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
    serial: Optional[str] =\
        Field(None, description="The serial number of the attached pipette")


class RequiredLabware(BaseModel):
    """A model describing all tipracks required, based on pipettes attached."""
    alternatives: List[str]
    slot: Optional[str]
    loadName: str
    namespace: str
    version: str
    isTiprack: bool


class TipCalibrationSessionStatus(BaseModel):
    """The current status of a tip length calibration session."""
    instrument: AttachedPipette
    currentStep: str = Field(
        ...,
        description="Current step of tip calibration user flow")
    nextSteps: Optional[Dict[str, Dict[str, Dict[str, Any]]]] =\
        Field(None, description="Next Available Steps in Session")
    labware: List[RequiredLabware]

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
                          "alternatives": ["filter_tip_rack_loadname"],
                          "slot": "8",
                          "loadName": "tiprack_loadname",
                          "namespace": "opentrons",
                          "version": "1",
                          "isTiprack": "true"
                      },
                      {
                          "alternatives": [],
                          "slot": "3",
                          "loadName": "cal_block_loadname",
                          "namespace": "opentrons",
                          "version": "1",
                          "isTiprack": "false"
                      }
                    ]
                }
            ]
        }

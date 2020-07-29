from typing import Dict, Optional, List, Any
from pydantic import BaseModel, Field


# TODO: BC: the mount field here is typed as a string
# because of serialization problems, though they are actually
# backed by enums. This shouldn't be the case, and we should
# be able to handle the de/serialization of these fields from
# the middle ware before they are returned to the client
class AttachedPipette(BaseModel):
    """Pipette (if any) attached to the mount"""
    model: str =\
        Field(None,
              description="The model of the attached pipette. These are snake "
                          "case as in the Protocol API. This includes the full"
                          " version string")
    name: str =\
        Field(None, description="Short name of pipette model without"
                                "generation version")
    tipLength: float =\
        Field(None, description="The default tip length for this pipette")
    mount: str =\
        Field(None, description="The mount this pipette attached to")
    serial: str =\
        Field(None, description="The serial number of the attached pipette")


class RequiredLabware(BaseModel):
    """A model describing all tipracks required, based on pipettes attached."""
    slot: str
    loadName: str
    namespace: str
    version: str
    isTiprack: bool
    definition: dict


class SessionCreateParams(BaseModel):
    """The parameters required to start a tip length calibration session."""
    mount: str = Field(
        ...,
        description='The mount on which the pipette is attached, left or right'
    )
    hasCalibrationBlock: bool = Field(
        ...,
        description='True if the user wants to use a calibration block; '
                    'False otherwise'
    )
    tipRackDefinition: dict = Field(
        ...,
        description='The full labware definition of the tiprack to calibrate.'
    )


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
                          "slot": "8",
                          "loadName": "tiprack_loadname",
                          "namespace": "opentrons",
                          "version": "1",
                          "isTiprack": "true",
                          "definition": {"ordering": "the ordering section..."}
                      },
                      {
                          "slot": "3",
                          "loadName": "cal_block_loadname",
                          "namespace": "opentrons",
                          "version": "1",
                          "isTiprack": "false",
                          "definition": {"ordering": "the ordering section..."}
                      }
                    ]
                }
            ]
        }

from pydantic import BaseModel, Field
from typing import List, Optional

from ..helper_classes import AttachedPipette, RequiredLabware


class DeckCalibrationSessionStatus(BaseModel):
    """The current status of a deck calibration session."""
    # TODO: make instrument not optional
    instrument: Optional[AttachedPipette]
    currentStep: str = Field(
        ...,
        description="Current step of deck calibration user flow")
    labware: List[RequiredLabware]

    class Config:
        schema_extra = {
            "example": [
                {
                    "instrument": {
                        "model": "p300_single_v1.5",
                        "name": "p300_single",
                        "tip_length": 42,
                        "mount": "right",
                        "serial": "P3HS12123041",
                    },
                    "currentStep": "sessionStarted",
                    "labware": [
                        {
                            "slot": "8",
                            "loadName": "opentrons_96_tiprack_300ul",
                            "namespace": "opentrons",
                            "version": 1,
                            "isTiprack": "true",
                            "definition": {
                                "ordering": "the ordering section..."
                            }
                        }
                    ]
                }
            ]
        }

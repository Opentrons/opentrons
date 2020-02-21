import typing
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field
from api.fastapi.models.control import Mount


class DeckStart(BaseModel):
    """Force refresh the deck calibration session if one is ongoing"""
    force: bool = Field(False,
                        description="Set to true to refresh the session")


class PipetteDeckCalibration(BaseModel):
    """
    Details of the pipette the system has selected for use in deck
    calibration
    """
    mount: Mount
    model: str = \
        Field(...,
              description="The model of the pipette attached in this mount")


class DeckStartResponse(BaseModel):
    """None"""
    token: UUID =\
        Field(...,
              description="The token to send along in future deck calibration "
                          "actions")
    pipette: PipetteDeckCalibration

    class Config:
        schema_extra = {"example": {
                  "token": "1fdec5cc-234a-11ea-b24d-f2189817b27e",
                  "pipette": {
                    "mount": "right",
                    "model": "p10_single_v1.5"
                  }
                }}


class DeckCalibrationPoint(str, Enum):
    """
    The name of a point relative to deck calibration. The number points are
    calibration crosses ("1" in slot 1, "2" in slot 3, "3" in slot 7); "safeZ"
    is a safe height above the deck, "attachTip" is a good place to go for the
    user to attach a tip.
    """
    one = "1"
    two = "2"
    three = "3"
    safeZ = "safeZ"
    attachTip = "attachTip"


class JogAxis(str, Enum):
    """The axis to jog"""
    x = "x"
    y = "y"
    z = "z"


class JogDirection(int, Enum):
    """The direction of the jog"""
    pos = 1
    neg = -1


class AttachTipArgs(BaseModel):
    """Command \"attach tip\" dispatch args"""


class DeckCalibrationCommand(str, Enum):
    """The command to execute"""
    jog = "jog"
    move = "move"
    save_xy = "save xy"
    attach_tip = "attach tip"
    detach_tip = "detach tip"
    save_z = "save z"
    save_transform = "save transform"
    release = "release"


class DeckCalibrationDispatch(BaseModel):
    token: UUID =\
        Field(..., description="The deck calibration session token")
    command: DeckCalibrationCommand
    tipLength: typing.Optional[float] = \
        Field(None,
              description="The length of the tip you are prompting the user to"
                          " attach. Required for command \"attach tip\"")
    point: typing.Optional[DeckCalibrationPoint] = \
        Field(None,
              description="Required for commands \"save xy\" and \"move\"")
    axis: typing.Optional[JogAxis] = \
        Field(None,
              description="The axis to jog. Required for \"jog\" command.")
    direction: typing.Optional[JogDirection] =\
        Field(None,
              description="The direction to jog. Required for \"jog\" "
                          "command.")
    step: typing.Optional[float] =\
        Field(None,
              description="The distance to jog. Required for \"jog\" command.")

    class Config:
        schema_extra = {"examples": {
                "jog": {
                  "description": "Jog +1mm in X",
                  "value": {
                    "command": "jog",
                    "token": "1fdec5cc-234a-11ea-b24d-f2189817b27e",
                    "axis": "x",
                    "direction": 1,
                    "step": 1
                  }
                },
                "move": {
                  "description": "Move to cross 1",
                  "value": {
                    "command": "move",
                    "token": "1fdec5cc-234a-11ea-b24d-f2189817b27e",
                    "point": "1"
                  }
                },
                "savexy": {
                  "description": "Save the XY position of cross 2 (in slot 3)",
                  "value": {
                    "command": "save xy",
                    "token": "1fdec5cc-234a-11ea-b24d-f2189817b27e",
                    "point": "2"
                  }
                },
                "attachTip": {
                  "description": "Inform the OT-2 that a tip is attached",
                  "value": {
                    "command": "attach tip",
                    "token": "1fdec5cc-234a-11ea-b24d-f2189817b27e",
                    "tipLength": 51.7
                  }
                },
                "detachTip": {
                  "description": "Inform the OT-2 that a tip has been removed",
                  "value": {
                    "command": "detach tip",
                    "token": "1fdec5cc-234a-11ea-b24d-f2189817b27e"
                  }
                },
                "saveZ": {
                  "description": "Save the current Z position as the height of"
                                 " the deck",
                  "value": {
                    "command": "save z",
                    "token": "1fdec5cc-234a-11ea-b24d-f2189817b27e"
                  }
                },
                "saveTransform": {
                  "description": "Save the current transform after saving all "
                                 "positions",
                  "value": {
                    "command": "save transform",
                    "token": "1fdec5cc-234a-11ea-b24d-f2189817b27e"
                  }
                },
                "release": {
                  "description": "End the deck calibration session",
                  "value": {
                    "command": "release",
                    "token": "1fdec5cc-234a-11ea-b24d-f2189817b27e"
                  }
                }
              }}

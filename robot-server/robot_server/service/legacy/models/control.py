import typing
from functools import partial
from enum import Enum

from pydantic import BaseModel, Field, root_validator


class MotionTarget(str, Enum):
    """
    What should be moved. If mount, move the nominal position of the mount;
    if pipette, move the nozzle of the pipette
    """
    pipette = "pipette"
    mount = "mount"


class HomeTarget(str, Enum):
    pipette = "pipette"
    robot = "robot"


Point = typing.List[float]

# Commonly used Point type description and constraints
PointField = partial(Field, ...,
                     description="A point in deck coordinates (x, y, z)",
                     min_items=3, max_items=3)


class ChangePipette(BaseModel):
    target: MotionTarget
    left: Point = PointField()
    right: Point = PointField()


class AttachTip(BaseModel):
    target: MotionTarget
    point: Point = PointField()


class RobotPositions(BaseModel):
    change_pipette: ChangePipette
    attach_tip: AttachTip


class RobotPositionsResponse(BaseModel):
    positions: RobotPositions

    class Config:
        schema_extra = {"example": {
            "positions": {
                "change_pipette": {
                    "target": "mount",
                    "left": [325, 40, 30],
                    "right": [65, 40, 30]
                },
                "attach_tip": {
                    "target": "pipette",
                    "point": [200, 90, 150]
                }
            }
        }}


class Mount(str, Enum):
    right = "right"
    left = "left"


class RobotMoveTarget(BaseModel):
    target: MotionTarget
    point: Point = PointField()
    mount: Mount = Field(..., description="Which mount to move")
    model: typing.Optional[str] = \
        Field(None,
              description="A pipette model that matches the pipette attached "
                          "to the specified mount. Required "
                          "if target is pipette")

    @root_validator(pre=True)
    def root_validator(cls, values):
        points = values.get("point", [])
        target = values.get("target")
        if target == MotionTarget.mount and \
                len(points) == 3 and points[2] < 30:
            raise ValueError("Sending a mount to a z position lower than 30 "
                             "can cause a collision with the deck or reach the"
                             " end of the Z axis  movement screw. Z values for"
                             " mount movement must be >= 30")
        return values

    class Config:
        schema_extra = {"examples": {
            "moveLeftMount": {
                "description": "Move the left mount, regardless of what is "
                               "attached to that mount, to a specific "
                               "position. Since you move the mount, the end of"
                               " the pipette will be in different places "
                               "depending on what pipette is attached - but "
                               "you don't have to know what's attached.",
                "summary": "Move left mount",
                "value": {
                    "target": "mount",
                    "point": [100, 100, 80],
                    "mount": "left"
                }
            },
            "moveRightP300Single": {
                "summary": "Move P300 Single on right mount",
                "description": "Move a P300 Single attached to the right mount"
                               " to a specific position. You have to specify "
                               "that it's a P300 Single that you're moving, "
                               "but as long as you specify the correct model "
                               "the end of the pipette will always be at the "
                               "specified position.",
                "value": {
                    "target": "pipette",
                    "mount": "right",
                    "model": "p300_single",
                    "point": [25, 25, 50]
                }
            }
        }}


class RobotHomeTarget(BaseModel):
    """Parameters for the home"""
    target: HomeTarget = \
        Field(...,
              description="What to home. Robot means to home all axes; "
                          "pipette, only that pipette's carriage and pipette "
                          "axes")
    mount: typing.Optional[Mount] = \
        Field(None,
              description="Which mount to home, if target is pipette (required"
                          " in that case)")

    @root_validator(pre=True)
    def root_validate(cls, values):
        # Make sure that mount is present if target is pipette
        if values.get("target") == HomeTarget.pipette.value \
                and not values.get("mount"):
            raise ValueError("mount must be specified if target is pipette")
        return values

    class Config:
        schema_extra = {"examples": {
            "homeGantry": {
                "summary": "Home Gantry",
                "description": "Home the robot's gantry",
                "value": {
                    "target": "robot"
                }
            },
            "homeRight": {
                "summary": "Home right pipette",
                "description": "Home only the right pipette",
                "value": {
                    "target": "pipette",
                    "mount": "right"
                }
            }
        }}


class RobotLightState(BaseModel):
    """Whether a light is (or should be turned) on or off"""
    on: bool = Field(..., description="The light state")

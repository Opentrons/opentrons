"""opentrons_shared_data.robot.dev_types: types for robot def."""
from typing import NewType, List, Dict, Any
from typing_extensions import Literal, TypedDict

RobotSchemaVersion1 = Literal[1]

RobotSchema = NewType("RobotSchema", Dict[str, Any])

RobotName = Literal["OT-2 Standard", "OT-3 Standard"]

RobotId = Literal["ot-2", "ot-3"]


class RobotDefinition(TypedDict):
    """A python version of the robot definition type."""

    otId: str
    friendlyName: str
    robotName: RobotName
    robotId: RobotId
    models: List[str]

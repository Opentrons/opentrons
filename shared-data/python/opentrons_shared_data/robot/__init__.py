"""opentrons_shared_data.robot: Submodule for handling robot definition data."""
from pathlib import Path
from typing_extensions import Final, Literal, NotRequired, TypedDict
import json
from .. import get_shared_data_root
import enum
from typing import NewType, List, Dict, Any, cast

RobotSchemaVersion1 = Literal[1]

RobotSchema = NewType("RobotSchema", Dict[str, Any])

RobotType = Literal["OT-2 Standard", "OT-3 Standard"]


class RobotTypeEnum(enum.Enum):
    """An enum representing the active robot type."""

    # TODO we should switch over to using Enums fully (if possible)
    # to represent our robot types in code -- rather than having
    # to string match everywhere.
    OT2 = enum.auto()
    FLEX = enum.auto()

    @classmethod
    def robot_literal_to_enum(cls, robot_type: RobotType) -> "RobotTypeEnum":
        """Convert Robot Type Literal to Robot Type Enum."""
        if robot_type == "OT-2 Standard":
            return cls.OT2
        elif robot_type == "OT-3 Standard":
            return cls.FLEX
        # No final `else` statement, depend on mypy exhaustiveness checking


class mountOffset(TypedDict):
    """The mount offsets for a given robot type based off the center of the carriage.."""

    left: List[float]
    right: List[float]
    gripper: NotRequired[List[float]]


class RobotDefinition(TypedDict):
    """A python version of the robot definition type."""

    displayName: str
    robotType: RobotType
    models: List[str]
    extents: List[float]
    mountOffsets: mountOffset


DEFAULT_ROBOT_DEFINITION_VERSION: Final = 1


def load(
    robot_type: RobotType, version: int = DEFAULT_ROBOT_DEFINITION_VERSION
) -> RobotDefinition:
    """Load the definition for the specified robot id."""
    for fi in Path(
        get_shared_data_root() / "robot" / "definitions" / f"{version}"
    ).iterdir():
        defn = json.load(fi.open("r"))
        if defn["robotType"] == robot_type:
            return cast(RobotDefinition, defn)
    raise KeyError(robot_type)


def user_facing_robot_type(robot_type: RobotType, include_article: bool = False) -> str:
    """Appropriately formatted robot type string for use in user-facing messages."""
    if robot_type == "OT-2 Standard":
        return "an OT-2" if include_article else "OT-2"
    elif robot_type == "OT-3 Standard":
        return "a Flex" if include_article else "Flex"

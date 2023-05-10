from opentrons_shared_data.robot.dev_types import RobotType

from . import commands
from .types import DeckSlotLocation, LabwareLocation, LabwareOffsetCreate


def standardize_labware_offset(
    original: LabwareOffsetCreate, robot_type: RobotType
) -> LabwareOffsetCreate:
    return original.copy(
        update={
            "location": original.location.copy(
                update={
                    "slotName": original.location.slotName.to_equivalent_for_robot_type(
                        robot_type
                    )
                }
            )
        }
    )


def standardize_command(
    original: commands.CommandCreate, robot_type: RobotType
) -> commands.CommandCreate:
    return original.normalize(robot_type)


def _standardize_load_labware(
    original: commands.LoadLabwareCreate, robot_type: RobotType
) -> commands.LoadLabwareCreate:
    raise NotImplementedError


def _standardize_load_module(
    original: commands.LoadModuleCreate, robot_type: RobotType
) -> commands.LoadModuleCreate:
    raise NotImplementedError


def _standardize_move_labware(
    original: commands.MoveLabwareCreate, robot_type: RobotType
) -> commands.MoveLabwareCreate:
    raise NotImplementedError


def _standardize_labware_location(
    original: LabwareLocation, robot_type: RobotType
) -> LabwareLocation:
    raise NotImplementedError

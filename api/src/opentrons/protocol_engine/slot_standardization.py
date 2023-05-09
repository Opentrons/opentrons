from opentrons_shared_data.robot.dev_types import RobotType

from .commands import CommandCreate, LoadLabwareParams, LoadModuleParams
from .types import DeckSlotLocation, LabwareOffsetCreate


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
    original: CommandCreate, robot_type: RobotType
) -> CommandCreate:
    return original.normalize(robot_type)

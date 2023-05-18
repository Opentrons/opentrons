from typing import Any, Union, Callable, Dict, Type, TypeVar

from opentrons_shared_data.robot.dev_types import RobotType

from . import commands
from .types import (
    OFF_DECK_LOCATION,
    DeckSlotLocation,
    LabwareLocation,
    LabwareOffsetCreate,
    ModuleLocation,
)


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
    try:
        standardize = _standardize_command_functions[type(original)]
    except KeyError:
        return original
    else:
        return standardize(original, robot_type)


# Our use of .copy(update=...) in these functions instead of .construct(...) is a tradeoff.
# .construct() gives us better type-checking,
# but .copy(update=...) prevents us from forgetting fields that have defaults.


def _standardize_load_labware(
    original: commands.LoadLabwareCreate, robot_type: RobotType
) -> commands.LoadLabwareCreate:
    params = original.params.copy(
        update={
            "location": _standardize_labware_location(
                original.params.location, robot_type
            )
        }
    )
    return original.copy(update={"params": params})


def _standardize_load_module(
    original: commands.LoadModuleCreate, robot_type: RobotType
) -> commands.LoadModuleCreate:
    params = original.params.copy(
        update={
            "location": _standardize_deck_slot_location(
                original.params.location, robot_type
            )
        }
    )
    return original.copy(update={"params": params})


def _standardize_move_labware(
    original: commands.MoveLabwareCreate, robot_type: RobotType
) -> commands.MoveLabwareCreate:
    params = original.params.copy(
        update={
            "newLocation": _standardize_labware_location(
                original.params.newLocation, robot_type
            )
        }
    )
    return original.copy(update={"params": params})


_standardize_command_functions: Dict[
    Type[commands.CommandCreate], Callable[[Any, RobotType], commands.CommandCreate]
] = {
    commands.LoadLabwareCreate: _standardize_load_labware,
    commands.LoadModuleCreate: _standardize_load_module,
    commands.MoveLabwareCreate: _standardize_move_labware,
}


def _standardize_labware_location(
    original: LabwareLocation, robot_type: RobotType
) -> LabwareLocation:
    if isinstance(original, DeckSlotLocation):
        return _standardize_deck_slot_location(original, robot_type)
    elif isinstance(original, ModuleLocation) or original == OFF_DECK_LOCATION:
        return original


def _standardize_deck_slot_location(
    original: DeckSlotLocation, robot_type: RobotType
) -> DeckSlotLocation:
    return original.copy(
        update={"slotName": original.slotName.to_equivalent_for_robot_type(robot_type)}
    )

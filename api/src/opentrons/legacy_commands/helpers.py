from typing import List, Union

from opentrons.protocol_api.labware import Well, Labware
from opentrons.protocol_api.module_contexts import ModuleContext
from opentrons.protocol_api.disposal_locations import TrashBin, WasteChute
from opentrons.protocol_api._types import OffDeckType
from opentrons.types import Location, DeckLocation
from opentrons.hardware_control.nozzle_manager import NozzleConfigurationType, NozzleMap

CommandLocation = Union[Location, Well]


def listify(
    location: Union[CommandLocation, List[CommandLocation]]
) -> List[CommandLocation]:
    if isinstance(location, list):
        try:
            return listify(location[0])
        except IndexError:
            # TODO(mc, 2021-10-20): this looks like a bug; should this
            # return an empty list, instead?
            return [location]  # type: ignore[list-item]
    else:
        return [location]


def _stringify_new_loc(loc: CommandLocation) -> str:
    if isinstance(loc, Location):
        if loc.labware.is_empty:
            return str(loc.point)
        else:
            return repr(loc.labware)
    elif isinstance(loc, Well):
        return str(loc)
    else:
        raise TypeError(loc)


def stringify_location(location: Union[CommandLocation, List[CommandLocation]]) -> str:
    loc_str_list = [_stringify_new_loc(loc) for loc in listify(location)]
    return ", ".join(loc_str_list)


def stringify_pickup_location_range(  # noqa: C901
    nozzle_map: NozzleMap, location: Well
) -> str:
    if nozzle_map.configuration == NozzleConfigurationType.SINGLE:
        loc_str_list = [_stringify_new_loc(location)]
    else:
        labware_columns = location.parent.columns()
        critical_column = 0
        critical_row = 0
        for column in labware_columns:
            if location in column:
                critical_row = column.index(location)
                critical_column = labware_columns.index(column)

        if nozzle_map.starting_nozzle == "A1":
            last_well_col = len(labware_columns) - 1
            last_well_row = len(labware_columns[0]) - 1
            if critical_column + len(nozzle_map.columns) < len(labware_columns):
                last_well_col = critical_column + (len(nozzle_map.columns) - 1)
            if critical_row + len(nozzle_map.rows) < len(
                labware_columns[critical_column]
            ):
                last_well_row = critical_row + (len(nozzle_map.rows) - 1)

            last_well = labware_columns[last_well_col][last_well_row]
            loc_str_list = [location.well_name + "-" + _stringify_new_loc(last_well)]

        elif nozzle_map.starting_nozzle == "A12":
            last_well_col = 0
            last_well_row = len(labware_columns[0]) - 1
            if critical_column - len(nozzle_map.columns) >= 0:
                last_well_col = critical_column - (len(nozzle_map.columns) - 1)
            if critical_row + len(nozzle_map.rows) < len(
                labware_columns[critical_column]
            ):
                last_well_row = critical_row + (len(nozzle_map.rows) - 1)

            last_well = labware_columns[last_well_col][last_well_row]
            loc_str_list = [location.well_name + "-" + _stringify_new_loc(last_well)]

        elif nozzle_map.starting_nozzle == "H1":
            first_well_col = len(labware_columns) - 1
            first_well_row = 0
            if critical_column + len(nozzle_map.columns) < len(labware_columns):
                first_well_col = critical_column + (len(nozzle_map.columns) - 1)
            if critical_row - len(nozzle_map.rows) >= 0:
                first_well_row = critical_row - (len(nozzle_map.rows) - 1)

            first_well = labware_columns[first_well_col][first_well_row]
            loc_str_list = [first_well.well_name + "-" + _stringify_new_loc(location)]

        elif nozzle_map.starting_nozzle == "H12":
            first_well_col = 0
            first_well_row = 0
            if critical_column - len(nozzle_map.columns) >= 0:
                first_well_col = critical_column - (len(nozzle_map.columns) - 1)
            if critical_row - len(nozzle_map.rows) >= 0:
                first_well_row = critical_row - (len(nozzle_map.rows) - 1)

            first_well = labware_columns[first_well_col][first_well_row]
            loc_str_list = [first_well.well_name + "-" + _stringify_new_loc(location)]

    return ", ".join(loc_str_list)


def stringify_disposal_location(location: Union[TrashBin, WasteChute]) -> str:
    if isinstance(location, TrashBin):
        return f"Trash Bin on slot {location.location.id}"
    elif isinstance(location, WasteChute):
        return "Waste Chute"


def _stringify_labware_movement_location(
    location: Union[DeckLocation, OffDeckType, Labware, ModuleContext, WasteChute]
) -> str:
    if isinstance(location, (int, str)):
        return f"slot {location}"
    elif isinstance(location, OffDeckType):
        return "off-deck"
    elif isinstance(location, Labware):
        return location.name
    elif isinstance(location, ModuleContext):
        return str(location)
    elif isinstance(location, WasteChute):
        return "Waste Chute"


def stringify_labware_movement_command(
    source_labware: Labware,
    destination: Union[DeckLocation, OffDeckType, Labware, ModuleContext, WasteChute],
    use_gripper: bool,
) -> str:
    source_labware_text = _stringify_labware_movement_location(source_labware)
    destination_text = _stringify_labware_movement_location(destination)
    gripper_text = " with gripper" if use_gripper else ""
    return f"Moving {source_labware_text} to {destination_text}{gripper_text}"

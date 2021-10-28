from typing import List, Union

from opentrons.protocol_api.labware import Well
from opentrons.types import Location


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

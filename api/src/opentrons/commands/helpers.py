from typing import Union, Sequence, List, Any

from opentrons.protocol_api.labware import Well
from opentrons.types import Location


CommandLocation = Union[Location, None, Sequence, Well]


def listify(location: Any) -> List:
    if isinstance(location, list):
        try:
            return listify(location[0])
        except IndexError:
            return [location]
    else:
        return [location]


def _stringify_new_loc(loc: Union[Location, Well]) -> str:
    if isinstance(loc, Location):
        if loc.labware.is_empty:
            return str(loc.point)
        else:
            return repr(loc.labware)
    elif isinstance(loc, Well):
        return str(loc)
    else:
        raise TypeError(loc)


def stringify_location(location: CommandLocation) -> str:
    loc_str_list = [_stringify_new_loc(loc)
                    for loc in listify(location)]
    return ', '.join(loc_str_list)

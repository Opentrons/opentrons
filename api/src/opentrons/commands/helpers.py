from typing import Union, Sequence, List, Any

from opentrons.protocol_api.labware import Well, Labware
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.types import Location


def make_command(name, payload):
    return {'name': name, 'payload': payload}


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
        if isinstance(loc.labware, str):
            return loc.labware
        elif isinstance(loc.labware, (Labware, Well, ModuleGeometry)):
            return repr(loc.labware)
        else:
            return str(loc.point)
    elif isinstance(loc, Well):
        return str(loc)
    elif not loc:
        return '?'
    else:
        raise TypeError(loc)


def stringify_location(location: Union[Location, None,
                                       Sequence]) -> str:
    loc_str_list = [_stringify_new_loc(loc)
                    for loc in listify(location)]
    return ', '.join(loc_str_list)

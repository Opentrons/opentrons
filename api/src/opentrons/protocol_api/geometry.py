from collections import UserDict
import logging
from typing import Union, Tuple

from opentrons.protocol_api.labware import Labware, Well
from opentrons import types

MODULE_LOG = logging.getLogger(__name__)

Location = Union[Labware, Well, types.Point, Tuple[float, float, float]]


def point_from_location(location: Location) -> types.Point:
    """ Build a deck-abs point from anything the user passes in """

    # Defined with an inner function like this to make logging the result
    # a bit less tedious and reasonably mypy-compliant
    def _point(loc: Location) -> types.Point:
        if isinstance(location, Well):
            return location.top()
        elif isinstance(location, Labware):
            return location.wells()[0].top()
        elif isinstance(location, tuple):
            return types.Point(*location[:3])
        else:
            return location

    point = _point(location)
    MODULE_LOG.debug("Location {} -> {}".format(location, point))
    return point


class Deck(UserDict):
    def __init__(self):
        super().__init__()
        row_offset = 90.5
        col_offset = 132.5
        for idx in range(1, 13):
            self.data[idx] = None
        self._positions = {idx+1: types.Point((idx % 3) * col_offset,
                                              idx//3 * row_offset,
                                              0)
                           for idx in range(12)}

    @staticmethod
    def _assure_int(key: object) -> int:
        if isinstance(key, str):
            return int(key)
        elif isinstance(key, int):
            return key
        else:
            raise TypeError(type(key))

    def _check_name(self, key: object) -> int:
        should_raise = False
        try:
            key_int = Deck._assure_int(key)
        except Exception:
            MODULE_LOG.exception("Bad slot name: {}".format(key))
            should_raise = True
        should_raise = should_raise or key_int not in self.data
        if should_raise:
            raise ValueError("Unknown slot: {}".format(key))
        else:
            return key_int

    def __getitem__(self, key: types.DeckLocation) -> Labware:
        return self.data[self._check_name(key)]

    def __delitem__(self, key: types.DeckLocation) -> None:
        self.data[self._check_name(key)] = None

    def __setitem__(self, key: types.DeckLocation, val: Labware) -> None:
        key_int = self._check_name(key)
        if self.data.get(key_int) is not None:
            raise ValueError('Deck location {} already has an item: {}'
                             .format(key, self.data[key_int]))
        self.data[key_int] = val

    def __contains__(self, key: object) -> bool:
        try:
            key_int = self._check_name(key)
        except ValueError:
            return False
        return key_int in self.data

    def position_for(self, key: types.DeckLocation) -> types.Point:
        key_int = self._check_name(key)
        return self._positions[key_int]

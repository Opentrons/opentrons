import enum
from typing import Union
from collections import namedtuple

_PointTuple = namedtuple('Point', ['x', 'y', 'z'])


class Point(_PointTuple):
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return False
        return self.x == other.x and self.y == other.y and self.z == other.z

    def __add__(self, other: tuple) -> 'Point':
        if not isinstance(other, Point):
            return NotImplemented
        return Point(self.x + other.x, self.y + other.y, self.z + other.z)

    def __sub__(self, other: tuple) -> 'Point':
        if not isinstance(other, Point):
            return NotImplemented
        return Point(self.x - other.x, self.y - other.y, self.z - other.z)


class Mount(enum.Enum):
    LEFT = enum.auto()
    RIGHT = enum.auto()


DeckLocation = Union[int, str]

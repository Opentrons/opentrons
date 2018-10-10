import enum
from typing import Union
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y', 'z'])


class Mount(enum.Enum):
    LEFT = enum.auto()
    RIGHT = enum.auto()


DeckLocation = Union[int, str]

import enum
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y', 'z'])


class Mount(enum.Enum):
    LEFT = enum.auto()
    RIGHT = enum.auto()

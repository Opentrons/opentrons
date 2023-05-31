from __future__ import annotations
import enum
from math import sqrt, isclose
from typing import TYPE_CHECKING, Any, NamedTuple, Iterable, Union, List

from .protocols.api_support.labware_like import LabwareLike

if TYPE_CHECKING:
    from .protocol_api.labware import Labware, Well
    from .protocol_api.core.legacy.module_geometry import ModuleGeometry
    from .protocol_api.module_contexts import ModuleContext


class PipetteNotAttachedError(KeyError):
    """An error raised if a pipette is accessed that is not attached"""

    pass


class Point(NamedTuple):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, Point):
            return False
        pairs = ((self.x, other.x), (self.y, other.y), (self.z, other.z))
        return all(isclose(s, o, rel_tol=1e-05, abs_tol=1e-08) for s, o in pairs)

    def __add__(self, other: Any) -> Point:
        if not isinstance(other, Point):
            return NotImplemented
        return Point(self.x + other.x, self.y + other.y, self.z + other.z)

    def __sub__(self, other: Any) -> Point:
        if not isinstance(other, Point):
            return NotImplemented
        return Point(self.x - other.x, self.y - other.y, self.z - other.z)

    def __mul__(self, other: Union[int, float]) -> Point:
        if not isinstance(other, (float, int)):
            return NotImplemented
        return Point(self.x * other, self.y * other, self.z * other)

    def __rmul__(self, other: Union[int, float]) -> Point:
        if not isinstance(other, (float, int)):
            return NotImplemented
        return Point(self.x * other, self.y * other, self.z * other)

    def __abs__(self) -> Point:
        return Point(abs(self.x), abs(self.y), abs(self.z))

    def __str__(self) -> str:
        return "({}, {}, {})".format(self.x, self.y, self.z)

    def magnitude_to(self, other: Any) -> float:
        if not isinstance(other, Point):
            return NotImplemented
        x_diff = self.x - other.x
        y_diff = self.y - other.y
        z_diff = self.z - other.z
        return sqrt(x_diff**2 + y_diff**2 + z_diff**2)


LocationLabware = Union[
    "Labware", "Well", str, "ModuleGeometry", LabwareLike, None, "ModuleContext"
]


class Location:
    """A location to target as a motion.

    The location contains a :py:class:`.Point` (in
    :ref:`protocol-api-deck-coords`) and possibly an associated
    :py:class:`.Labware` or :py:class:`.Well` instance.

    It should rarely be constructed directly by the user; rather, it is the
    return type of most :py:class:`.Well` accessors like :py:meth:`.Well.top`
    and is passed directly into a method like ``InstrumentContext.aspirate()``.

    .. warning::
       The ``.labware`` attribute of this class is used by the protocol
       API internals to, among other things, determine safe heights to retract
       the instruments to when moving between locations. If constructing an
       instance of this class manually, be sure to either specify ``None`` as the
       labware (so the robot does its worst case retraction) or specify the
       correct labware for the ``.point`` attribute.


    .. warning::
       The ``==`` operation compares both the position and associated labware.
       If you only need to compare locations, compare the ``.point``
       of each item.
    """

    def __init__(self, point: Point, labware: LocationLabware):
        self._point = point
        self._labware = LabwareLike(labware)

    # todo(mm, 2021-10-01): Figure out how to get .point and .labware to show up
    # in the rendered docs, and then update the class docstring to use cross-references.

    @property
    def point(self) -> Point:
        return self._point

    @property
    def labware(self) -> LabwareLike:
        return self._labware

    def __iter__(self) -> Iterable[Union[Point, LabwareLike]]:
        """Iterable interface to support unpacking. Like a tuple."""
        return iter(
            (
                self._point,
                self._labware,
            )
        )

    def __eq__(self, other: object) -> bool:
        return (
            isinstance(other, Location)
            and other._point == self._point
            and other._labware == self._labware
        )

    def move(self, point: Point) -> "Location":
        """
        Alter the point stored in the location while preserving the labware.

        This returns a new Location and does not alter the current one. It
        should be used like

        .. code-block:: python

            >>> loc = Location(Point(1, 1, 1), None)
            >>> new_loc = loc.move(Point(1, 1, 1))
            >>>
            >>> # The new point is the old one plus the given offset.
            >>> assert new_loc.point == Point(2, 2, 2)  # True
            >>>
            >>> # The old point hasn't changed.
            >>> assert loc.point == Point(1, 1, 1)  # True

        """
        return Location(point=self.point + point, labware=self._labware.object)

    def __repr__(self) -> str:
        return f"Location(point={repr(self._point)}, labware={self._labware})"


# TODO(mc, 2020-10-22): use MountType implementation for Mount
class Mount(enum.Enum):
    LEFT = enum.auto()
    RIGHT = enum.auto()
    EXTENSION = enum.auto()

    def __str__(self) -> str:
        return self.name

    @classmethod
    def ot2_mounts(cls) -> List["Mount"]:
        return [Mount.LEFT, Mount.RIGHT]

    @classmethod
    def string_to_mount(cls, mount: str) -> "Mount":
        if mount == "right":
            return cls.RIGHT
        elif mount == "left":
            return cls.LEFT
        else:
            return cls.EXTENSION


class MountType(str, enum.Enum):
    LEFT = "left"
    RIGHT = "right"
    EXTENSION = "extension"

    # TODO (spp, 2023-05-04): we should deprecate this and instead create an 'other_pipette_mount' method
    def other_mount(self) -> MountType:
        return MountType.LEFT if self is MountType.RIGHT else MountType.RIGHT

    def to_hw_mount(self) -> Mount:
        return {
            MountType.LEFT: Mount.LEFT,
            MountType.RIGHT: Mount.RIGHT,
            MountType.EXTENSION: Mount.EXTENSION,
        }[self]

    @staticmethod
    def from_hw_mount(mount: Mount) -> MountType:
        """Convert from Mount to MountType."""
        mount_map = {Mount.LEFT: MountType.LEFT, Mount.RIGHT: MountType.RIGHT}
        return mount_map[mount]


class PipetteMountType(enum.Enum):
    LEFT = "left"
    RIGHT = "right"
    COMBINED = "combined"  # added for 96-channel. Remove if not required

    def to_mount_type(self) -> MountType:
        return {
            PipetteMountType.LEFT: MountType.LEFT,
            PipetteMountType.RIGHT: MountType.RIGHT,
        }[self]


# What is this used for? Can we consolidate this into MountType?
# If not, can we change the 'GRIPPER' mount name to 'EXTENSION' so that it's
# consistent with all user-facing mount names?
class OT3MountType(str, enum.Enum):
    LEFT = "left"
    RIGHT = "right"
    GRIPPER = "gripper"


DECK_COORDINATE_TO_SLOT_NAME = {
    "D1": "1",
    "D2": "2",
    "D3": "3",
    "C1": "4",
    "C2": "5",
    "C3": "6",
    "B1": "7",
    "B2": "8",
    "B3": "9",
    "A1": "10",
    "A2": "11",
    "A3": "12",
}

DECK_SLOT_NAME_TO_COORDINATE = {
    slot_name: coordinate
    for coordinate, slot_name in DECK_COORDINATE_TO_SLOT_NAME.items()
}


# TODO(mc, 2020-11-09): this makes sense in shared-data or other common
# model library
# https://github.com/Opentrons/opentrons/pull/6943#discussion_r519029833
class DeckSlotName(enum.Enum):
    """Deck slot identifiers."""

    SLOT_1 = "1"
    SLOT_2 = "2"
    SLOT_3 = "3"
    SLOT_4 = "4"
    SLOT_5 = "5"
    SLOT_6 = "6"
    SLOT_7 = "7"
    SLOT_8 = "8"
    SLOT_9 = "9"
    SLOT_10 = "10"
    SLOT_11 = "11"
    FIXED_TRASH = "12"

    @classmethod
    def from_primitive(cls, value: DeckLocation) -> DeckSlotName:
        str_val = str(value).upper()
        if str_val in DECK_COORDINATE_TO_SLOT_NAME:
            str_val = DECK_COORDINATE_TO_SLOT_NAME[str_val]
        return cls(str_val)

    def as_int(self) -> int:
        return int(self.value)

    def as_coordinate(self) -> str:
        return DECK_SLOT_NAME_TO_COORDINATE[self.value]

    @property
    def id(self) -> str:
        """This slot's unique ID, as it appears in the deck definition.

        This can be used to look up slot details in the deck definition.

        This is preferred over `.value` or `.__str__()` for explicitness.
        """
        return self.value

    def __str__(self) -> str:
        """Stringify to the unique ID.

        For explicitness, prefer using `.id` instead.
        """
        return self.id


class TransferTipPolicy(enum.Enum):
    ONCE = enum.auto()
    NEVER = enum.auto()
    ALWAYS = enum.auto()


DeckLocation = Union[int, str]

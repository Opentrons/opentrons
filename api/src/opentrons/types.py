from __future__ import annotations
import enum
from math import sqrt, isclose
from typing import TYPE_CHECKING, Any, NamedTuple, Iterator, Union, List

from opentrons_shared_data.robot.types import RobotType

from .protocols.api_support.labware_like import LabwareLike

if TYPE_CHECKING:
    from .protocol_api.labware import Labware, Well
    from .protocol_api.core.legacy.module_geometry import ModuleGeometry
    from .protocol_api.module_contexts import ModuleContext
    from .protocol_api._types import OffDeckType


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

    def __mul__(self, other: Union[int, float]) -> Point:  # type: ignore[override]
        if not isinstance(other, (float, int)):
            return NotImplemented
        return Point(self.x * other, self.y * other, self.z * other)

    def __rmul__(self, other: Union[int, float]) -> Point:  # type: ignore[override]
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
    "Labware",
    "Well",
    str,
    "ModuleGeometry",
    LabwareLike,
    None,
    "OffDeckType",
    "ModuleContext",
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

    def __init__(
        self,
        point: Point,
        labware: Union[
            "Labware",
            "Well",
            str,
            "ModuleGeometry",
            LabwareLike,
            None,
            "ModuleContext",
        ],
    ):
        self._point = point
        self._given_labware = labware
        self._labware = LabwareLike(labware)

    # todo(mm, 2021-10-01): Figure out how to get .point and .labware to show up
    # in the rendered docs, and then update the class docstring to use cross-references.

    @property
    def point(self) -> Point:
        return self._point

    @property
    def labware(self) -> LabwareLike:
        return self._labware

    def __iter__(self) -> Iterator[Union[Point, LabwareLike]]:
        """Iterable interface to support unpacking. Like a tuple.

        .. note::
           While type annotations cannot properly support this, it will work in practice:

           point, labware = location
           some_function_taking_both(*location)
        """
        return iter((self._point, self._labware))  # type: ignore [arg-type]

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

        return Location(point=self.point + point, labware=self._given_labware)

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


# TODO(mc, 2020-11-09): this makes sense in shared-data or other common
# model library
# https://github.com/Opentrons/opentrons/pull/6943#discussion_r519029833
class DeckSlotName(enum.Enum):
    """Deck slot identifiers."""

    # OT-2:
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

    # OT-3:
    SLOT_A1 = "A1"
    SLOT_A2 = "A2"
    SLOT_A3 = "A3"
    SLOT_B1 = "B1"
    SLOT_B2 = "B2"
    SLOT_B3 = "B3"
    SLOT_C1 = "C1"
    SLOT_C2 = "C2"
    SLOT_C3 = "C3"
    SLOT_D1 = "D1"
    SLOT_D2 = "D2"
    SLOT_D3 = "D3"

    @classmethod
    def from_primitive(cls, value: DeckLocation) -> DeckSlotName:
        str_val = str(value).upper()
        return cls(str_val)

    # TODO(mm, 2023-05-08):
    # Migrate callers off of this method. https://opentrons.atlassian.net/browse/RLAB-345
    def as_int(self) -> int:
        """Return this deck slot as an OT-2-style integer.

        For example, `SLOT_5.as_int()` and `SLOT_C2.as_int()` are both `5`.

        Deprecated:
            This will not make sense when the OT-3 has staging area slots.
        """
        return int(self.to_ot2_equivalent().value)

    def to_ot2_equivalent(self) -> DeckSlotName:
        """Return the OT-2 deck slot that's in the same place as this one.

        For example, `SLOT_C2.to_ot3_equivalent()` is `SLOT_5`.

        If this is already an OT-2 deck slot, returns itself.
        """
        return _ot3_to_ot2.get(self, self)

    def to_ot3_equivalent(self) -> DeckSlotName:
        """Return the OT-3 deck slot that's in the same place as this one.

        For example, `SLOT_5.to_ot3_equivalent()` is `SLOT_C2`.

        If this is already an OT-3 deck slot, returns itself.
        """
        return _ot2_to_ot3.get(self, self)

    def to_equivalent_for_robot_type(self, robot_type: RobotType) -> DeckSlotName:
        """Return the deck slot, for the given robot type, that's in the same place as this one.

        See `to_ot2_equivalent()` and `to_ot3_equivalent()`.
        """
        if robot_type == "OT-2 Standard":
            return self.to_ot2_equivalent()
        elif robot_type == "OT-3 Standard":
            return self.to_ot3_equivalent()

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


_slot_equivalencies = [
    (DeckSlotName.SLOT_1, DeckSlotName.SLOT_D1),
    (DeckSlotName.SLOT_2, DeckSlotName.SLOT_D2),
    (DeckSlotName.SLOT_3, DeckSlotName.SLOT_D3),
    (DeckSlotName.SLOT_4, DeckSlotName.SLOT_C1),
    (DeckSlotName.SLOT_5, DeckSlotName.SLOT_C2),
    (DeckSlotName.SLOT_6, DeckSlotName.SLOT_C3),
    (DeckSlotName.SLOT_7, DeckSlotName.SLOT_B1),
    (DeckSlotName.SLOT_8, DeckSlotName.SLOT_B2),
    (DeckSlotName.SLOT_9, DeckSlotName.SLOT_B3),
    (DeckSlotName.SLOT_10, DeckSlotName.SLOT_A1),
    (DeckSlotName.SLOT_11, DeckSlotName.SLOT_A2),
    (DeckSlotName.FIXED_TRASH, DeckSlotName.SLOT_A3),
]

_ot2_to_ot3 = {ot2: ot3 for ot2, ot3 in _slot_equivalencies}
_ot3_to_ot2 = {ot3: ot2 for ot2, ot3 in _slot_equivalencies}


# TODO(jbl 11-17-2023) move this away from being an Enum and make this a NewType or something similar
class StagingSlotName(enum.Enum):
    """Staging slot identifiers."""

    SLOT_A4 = "A4"
    SLOT_B4 = "B4"
    SLOT_C4 = "C4"
    SLOT_D4 = "D4"

    @classmethod
    def from_primitive(cls, value: str) -> StagingSlotName:
        str_val = value.upper()
        return cls(str_val)

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
ALLOWED_PRIMARY_NOZZLES = ["A1", "H1", "A12", "H12"]

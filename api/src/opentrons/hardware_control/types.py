import enum
import logging
from dataclasses import dataclass
from typing import cast, Tuple, Union, List, Callable, Dict, TypeVar
from typing_extensions import Literal
from opentrons import types as top_types


MODULE_LOG = logging.getLogger(__name__)


class OutOfBoundsMove(RuntimeError):
    def __init__(self, message: str):
        self.message = message
        super().__init__()

    def __str__(self) -> str:
        return f"OutOfBoundsMove: {self.message}"

    def __repr__(self) -> str:
        return f"<{str(self.__class__)}: {self.message}>"


class MotionChecks(enum.Enum):
    NONE = 0
    LOW = 1
    HIGH = 2
    BOTH = 3


class Axis(enum.Enum):
    X = 0
    Y = 1
    Z = 2
    A = 3
    B = 4
    C = 5

    @classmethod
    def by_mount(cls, mount: top_types.Mount) -> "Axis":
        bm = {top_types.Mount.LEFT: cls.Z, top_types.Mount.RIGHT: cls.A}
        return bm[mount]

    @classmethod
    def mount_axes(cls) -> Tuple["Axis", "Axis"]:
        """The axes which are used for moving pipettes up and down."""
        return cls.Z, cls.A

    @classmethod
    def gantry_axes(cls) -> Tuple["Axis", "Axis", "Axis", "Axis"]:
        """The axes which are tied to the gantry and require the deck
        calibration transform
        """
        return cls.X, cls.Y, cls.Z, cls.A

    @classmethod
    def of_plunger(cls, mount: top_types.Mount) -> "Axis":
        pm = {top_types.Mount.LEFT: cls.B, top_types.Mount.RIGHT: cls.C}
        return pm[mount]

    @classmethod
    def to_mount(cls, inst: "Axis") -> top_types.Mount:
        return {
            cls.Z: top_types.Mount.LEFT,
            cls.A: top_types.Mount.RIGHT,
            cls.B: top_types.Mount.LEFT,
            cls.C: top_types.Mount.RIGHT,
        }[inst]

    def __str__(self) -> str:
        return self.name


class OT3Mount(enum.Enum):
    LEFT = top_types.Mount.LEFT.value
    RIGHT = top_types.Mount.RIGHT.value
    GRIPPER = enum.auto()

    @classmethod
    def from_mount(cls, mount: Union[top_types.Mount, "OT3Mount"]) -> "OT3Mount":
        return cls[mount.name]

    def to_mount(self) -> top_types.Mount:
        if self.value == self.GRIPPER.value:
            raise KeyError("Gripper mount is not representable")
        return top_types.Mount[self.name]


class OT3AxisKind(enum.Enum):
    """An enum of the different kinds of axis we have.

    The machine may have different numbers of specific axes implementing
    each axis kind.
    """

    X = 0
    #: Gantry X axis
    Y = 1
    #: Gantry Y axis
    Z = 2
    #: Z axis (of the left and right and gripper mounts)
    P = 3
    #: Plunger axis (of the left and right pipettes)
    OTHER = 4
    #: The internal axes of high throughput pipettes, for instance

    def __str__(self) -> str:
        return self.name


class OT3Axis(enum.Enum):
    X = 0  # gantry
    Y = 1
    Z_L = 2  # left pipette mount Z
    Z_R = 3  # right pipette mount Z
    Z_G = 4  # gripper mount Z
    P_L = 5  # left pipette plunger
    P_R = 6  # right pipette plunger
    Q = 7  # hi-throughput pipette tiprack grab
    G = 8  # gripper grab

    @classmethod
    def by_mount(cls, mount: Union[top_types.Mount, OT3Mount]) -> "OT3Axis":
        bm = {
            top_types.Mount.LEFT: cls.Z_L,
            top_types.Mount.RIGHT: cls.Z_R,
            OT3Mount.LEFT: cls.Z_L,
            OT3Mount.RIGHT: cls.Z_R,
            OT3Mount.GRIPPER: cls.Z_G,
        }
        return bm[mount]

    @classmethod
    def from_axis(cls, axis: Union[Axis, "OT3Axis"]) -> "OT3Axis":
        am = {
            Axis.X: cls.X,
            Axis.Y: cls.Y,
            Axis.Z: cls.Z_L,
            Axis.A: cls.Z_R,
            Axis.B: cls.P_L,
            Axis.C: cls.P_R,
        }
        try:
            return am[axis]  # type: ignore
        except KeyError:
            return axis  # type: ignore

    def to_axis(self) -> Axis:
        am = {
            OT3Axis.X: Axis.X,
            OT3Axis.Y: Axis.Y,
            OT3Axis.Z_L: Axis.Z,
            OT3Axis.Z_R: Axis.A,
            OT3Axis.P_L: Axis.B,
            OT3Axis.P_R: Axis.C,
        }
        return am[self]

    @classmethod
    def pipette_axes(cls) -> Tuple["OT3Axis", "OT3Axis"]:
        """The axes which are used for moving plunger motors."""
        return cls.P_L, cls.P_R

    @classmethod
    def mount_axes(cls) -> Tuple["OT3Axis", "OT3Axis"]:
        """The axes which are used for moving pipettes up and down."""
        return cls.Z_L, cls.Z_R

    @classmethod
    def gantry_axes(
        cls,
    ) -> Tuple["OT3Axis", "OT3Axis", "OT3Axis", "OT3Axis"]:
        """The axes which are tied to the gantry and require the deck
        calibration transform
        """
        return cls.X, cls.Y, cls.Z_L, cls.Z_R

    @classmethod
    def of_main_tool_actuator(
        cls, mount: Union[top_types.Mount, OT3Mount]
    ) -> "OT3Axis":
        if isinstance(mount, top_types.Mount):
            checked_mount = OT3Mount.from_mount(mount)
        else:
            checked_mount = mount
        pm = {
            OT3Mount.LEFT: cls.P_L,
            OT3Mount.RIGHT: cls.P_R,
            OT3Mount.GRIPPER: cls.Z_G,
        }
        return pm[checked_mount]

    @classmethod
    def to_kind(cls, axis: "OT3Axis") -> OT3AxisKind:
        kind_map: Dict[OT3Axis, OT3AxisKind] = {
            cls.P_L: OT3AxisKind.P,
            cls.P_R: OT3AxisKind.P,
            cls.X: OT3AxisKind.X,
            cls.Y: OT3AxisKind.Y,
            cls.Z_L: OT3AxisKind.Z,
            cls.Z_R: OT3AxisKind.Z,
            cls.Z_G: OT3AxisKind.Z,
            cls.Q: OT3AxisKind.OTHER,
            cls.G: OT3AxisKind.OTHER,
        }
        return kind_map[axis]

    @classmethod
    def of_kind(cls, kind: OT3AxisKind) -> List["OT3Axis"]:
        kind_map: Dict[OT3AxisKind, List[OT3Axis]] = {
            OT3AxisKind.P: [cls.P_R, cls.P_L],
            OT3AxisKind.X: [cls.X],
            OT3AxisKind.Y: [cls.Y],
            OT3AxisKind.Z: [cls.Z_G, cls.Z_L, cls.Z_R],
            OT3AxisKind.OTHER: [cls.Q, cls.G],
        }
        return kind_map[kind]

    @classmethod
    def to_mount(cls, inst: "OT3Axis") -> OT3Mount:
        return {
            cls.Z_R: OT3Mount.RIGHT,
            cls.Z_L: OT3Mount.LEFT,
            cls.P_L: OT3Mount.LEFT,
            cls.P_R: OT3Mount.RIGHT,
            cls.Z_G: OT3Mount.GRIPPER,
            cls.G: OT3Mount.GRIPPER,
        }[inst]

    def __str__(self) -> str:
        return self.name

    def of_point(self, point: top_types.Point) -> float:
        if OT3Axis.to_kind(self) == OT3AxisKind.Z:
            return point.z
        elif self == OT3Axis.X:
            return point.x
        elif self == OT3Axis.Y:
            return point.y
        else:
            raise KeyError(self)

    def set_in_point(self, point: top_types.Point, position: float) -> top_types.Point:
        if OT3Axis.to_kind(self) == OT3AxisKind.Z:
            return point._replace(z=position)
        elif self == OT3Axis.X:
            return point._replace(x=position)
        elif self == OT3Axis.Y:
            return point._replace(y=position)
        else:
            raise KeyError(self)


class OT3SubSystem(enum.Enum):
    """An enumeration of ot3 components.

    This is a complete list of unique firmware nodes in the ot3.
    """

    gantry_x = 0
    gantry_y = 1
    head = 2
    pipette_left = 3
    pipette_right = 4
    gripper = 5

    def __str__(self) -> str:
        return self.name


BCAxes = Union[Axis, OT3Axis]
AxisMapValue = TypeVar("AxisMapValue")
OT3AxisMap = Dict[OT3Axis, AxisMapValue]


@dataclass
class CurrentConfig:
    hold_current: float
    run_current: float

    def as_tuple(self) -> Tuple[float, float]:
        return self.hold_current, self.run_current


class DoorState(enum.Enum):
    OPEN = False
    CLOSED = True

    def __str__(self) -> str:
        return self.name.lower()


class HardwareEventType(enum.Enum):
    DOOR_SWITCH_CHANGE = enum.auto()
    ERROR_MESSAGE = enum.auto()


@dataclass
class DoorStateNotification:
    event: Literal[
        HardwareEventType.DOOR_SWITCH_CHANGE
    ] = HardwareEventType.DOOR_SWITCH_CHANGE
    new_state: DoorState = DoorState.CLOSED
    blocking: bool = False


@dataclass
class ErrorMessageNotification:
    message: str
    event: Literal[HardwareEventType.ERROR_MESSAGE] = HardwareEventType.ERROR_MESSAGE


# new event types get new dataclasses
# when we add more event types we add them here
HardwareEvent = Union[DoorStateNotification, ErrorMessageNotification]

HardwareEventHandler = Callable[[HardwareEvent], None]


RevisionLiteral = Literal["2.1", "A", "B", "C", "UNKNOWN"]


class BoardRevision(enum.Enum):
    UNKNOWN = enum.auto()
    OG = enum.auto()
    A = enum.auto()
    B = enum.auto()
    C = enum.auto()

    @classmethod
    def by_bits(cls, rev_bits: Tuple[bool, bool]) -> "BoardRevision":
        br = {
            (True, True): cls.OG,
            (False, True): cls.A,
            (True, False): cls.B,
            (False, False): cls.C,
        }
        return br[rev_bits]

    def real_name(self) -> Union[RevisionLiteral, Literal["UNKNOWN"]]:
        rn = "2.1" if self.name == "OG" else self.name
        return cast(Union[RevisionLiteral, Literal["UNKNOWN"]], rn)

    def __str__(self) -> str:
        return self.real_name()


class CriticalPoint(enum.Enum):
    """Possibilities for the point to move in a move call.

    The active critical point determines the offsets that are added to the
    gantry position when moving a pipette around.
    """

    MOUNT = enum.auto()
    """
    For legacy reasons, the position of the end of a P300 single. The default
    when no pipette is attached, and used for consistent behavior in certain
    contexts (like change pipette) when a variety of different pipettes might
    be attached.
    """

    NOZZLE = enum.auto()
    """
    The end of the nozzle of a single pipette or the end of the back-most
    nozzle of a multipipette. Only relevant when a pipette is present.
    """

    TIP = enum.auto()
    """
    The end of the tip of a single pipette or the end of the back-most
    tip of a multipipette. Only relevant when a pipette is present and
    a tip with known tip length is attached.
    """

    XY_CENTER = enum.auto()
    """
    Separately from the z component of the critical point, XY_CENTER means
    the critical point under consideration is the XY center of the pipette.
    This changes nothing for single pipettes, but makes multipipettes
    move their centers - so between channels 4 and 5 - to the specified
    point.
    """

    FRONT_NOZZLE = enum.auto()
    """
    The end of the front-most nozzle of a multipipette with a tip attached.
    Only relevant when a multichannel pipette is present.
    """


class ExecutionState(enum.Enum):
    RUNNING = enum.auto()
    PAUSED = enum.auto()
    CANCELLED = enum.auto()

    def __str__(self) -> str:
        return self.name


class HardwareAction(enum.Enum):
    DROPTIP = enum.auto()
    ASPIRATE = enum.auto()
    DISPENSE = enum.auto()
    BLOWOUT = enum.auto()
    PREPARE_ASPIRATE = enum.auto()

    def __str__(self) -> str:
        return self.name


class PauseType(enum.Enum):
    PAUSE = 0
    DELAY = 1


@dataclass
class AionotifyEvent:
    flags: enum.EnumMeta
    name: str

    @classmethod
    def build(cls, name: str, flags: List[enum.Enum]) -> "AionotifyEvent":
        # See https://github.com/python/mypy/issues/5317
        # as to why mypy cannot detect that list
        # comprehension or variables cannot be dynamically
        # determined to meet the argument criteria for
        # enums. Hence, the type ignore below.
        flag_list = [f.name for f in flags]
        Flag = enum.Enum("Flag", flag_list)  # type: ignore
        return cls(flags=Flag, name=name)


class PauseResumeError(RuntimeError):
    pass


class ExecutionCancelledError(RuntimeError):
    pass


class MustHomeError(RuntimeError):
    pass


class NoTipAttachedError(RuntimeError):
    pass


class TipAttachedError(RuntimeError):
    pass

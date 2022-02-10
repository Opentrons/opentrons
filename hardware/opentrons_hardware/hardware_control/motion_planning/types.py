"""Motion planning types."""
from __future__ import annotations
import logging
import enum
import dataclasses
import numpy as np  # type: ignore[import]
from typing import (
    cast,
    Any,
    SupportsFloat,
    Dict,
    Iterator,
    List,
    OrderedDict,
    Tuple,
    Union,
    Optional
)

log = logging.getLogger(__name__)

AcceptableType = Union[SupportsFloat, np.float64]


class Axis(enum.Enum):
    """Robot axis."""

    X = 0, "X"
    Y = 1, "Y"
    Z = 2, "Z"
    A = 3, "Z"

    def __new__(cls, value: int, lookup: str):
        member = object.__new__(cls)
        member._value_ = value
        member.lookup = lookup
        return member

    @classmethod
    def get_all_axes(cls) -> List[Axis]:
        """Return all system axes of the robot."""
        return [cls.X, cls.Y, cls.Z, cls.A]


@dataclasses.dataclass(frozen=False)
class Coordinates:
    """Coordinates for all axes."""

    X: np.float64
    Y: np.float64
    Z: np.float64
    A: np.float64

    def __init__(
        self, X: AcceptableType, Y: AcceptableType, Z: AcceptableType, A: AcceptableType
    ) -> None:
        """Constructor."""
        self.X = np.float64(X)
        self.Y = np.float64(Y)
        self.Z = np.float64(Z)
        self.A = np.float64(A)

    def __iter__(self) -> Coordinates:
        """Return an iterator."""
        return self

    def __getitem__(self, key: Axis) -> np.float64:
        """Access axis coordinate value."""
        return self.to_dict()[key]

    def to_dict(self) -> OrderedDict[Axis, np.float64]:
        """Return Coordaintes as a dictionary."""
        vectorized = self.vectorize()
        return OrderedDict(zip(Axis.get_all_axes(), vectorized))

    @classmethod
    def from_iter(cls, iter: Iterator[AcceptableType]) -> Coordinates:
        """Create coordinates from an iterator of floats."""
        return cls(*(np.float64(i) for i in iter))

    def vectorize(self) -> np.ndarray:
        """Represent coordinates as a Numpy array."""
        return np.array(dataclasses.astuple(self))

    def is_unit_vector(self) -> bool:
        """Return true if this is a unit vector."""
        vectorized = self.vectorize()
        magnitude = np.linalg.norm(vectorized)
        return cast(bool, np.isclose(magnitude, 1.0))


@dataclasses.dataclass
class Block:
    """One of three groups that makes up a move."""

    distance: np.float64
    initial_speed: np.float64
    acceleration: np.float64
    final_speed: np.float64 = dataclasses.field(init=False)
    time: np.float64 = dataclasses.field(init=False)

    def __init__(
        self,
        distance: AcceptableType,
        initial_speed: AcceptableType,
        acceleration: AcceptableType,
    ) -> None:
        """Constructor."""
        self.distance = np.float64(distance)
        self.initial_speed = np.float64(initial_speed)
        self.acceleration = np.float64(acceleration)
        self.__post_init__()

    def __post_init__(self) -> None:
        """Initialize field values in post-init processing."""

        def _final_speed() -> np.float64:
            """Get final speed of the block."""
            return np.sqrt(
                self.initial_speed**2 + self.acceleration * self.distance * 2
            )

        def _time() -> np.float64:
            """Get the time it takes for the block to complete its motion."""
            if self.acceleration:
                return (self.final_speed - self.initial_speed) / self.acceleration
            else:
                if not self.initial_speed:
                    return np.float64(0.0)
                return self.distance / self.initial_speed

        self.final_speed = _final_speed()
        self.time = _time()


@dataclasses.dataclass(frozen=False)
class Move:
    """A trajectory between two coordinates."""

    unit_vector: Coordinates
    distance: np.float64
    max_speed: np.float64
    blocks: Tuple[Block, Block, Block]
    initial_speed: np.float64 = dataclasses.field(init=False)
    final_speed: np.float64 = dataclasses.field(init=False)
    nonzero_blocks: int = dataclasses.field(init=False)

    def __init__(
        self,
        unit_vector: Coordinates,
        distance: np.float64,
        max_speed: np.float64,
        blocks: Tuple[Block, Block, Block],
    ) -> None:
        """Constructor."""
        # verify unit vector before creating Move
        if not unit_vector.is_unit_vector():
            raise ValueError(f"{unit_vector} is not a valid unit vector.")
        self.unit_vector = unit_vector
        self.distance = distance
        self.max_speed = max_speed
        self.blocks = blocks
        self.__post_init__()

    def __post_init__(self) -> None:
        """Initialize field values in post-init processing."""

        def _initial_speed() -> np.float64:
            """Get initial speed of the move."""
            for block in self.blocks:
                if block.distance == 0:
                    continue
                return block.initial_speed
            return np.float64(0.0)

        def _final_speed() -> np.float64:
            """Get final speed of the move."""
            for block in reversed(self.blocks):
                if block.distance == 0:
                    continue
                return block.final_speed
            return np.float64(0.0)

        self.initial_speed = _initial_speed()
        self.final_speed = _final_speed()
        self.nonzero_blocks = len([b for b in self.blocks if b.time])

    @classmethod
    def build_dummy_move(cls) -> Move:
        """Return a Move with dummy values."""
        return cls(
            unit_vector=Coordinates(1, 0, 0, 0),
            distance=np.float64(0),
            max_speed=np.float64(0),
            blocks=(
                Block(distance=0.0, initial_speed=0, acceleration=0),
                Block(distance=0, initial_speed=0, acceleration=0),
                Block(distance=0, initial_speed=0, acceleration=0),
            ),
        )

    @classmethod
    def build(
        cls,
        unit_vector: Coordinates,
        distance: AcceptableType,
        max_speed: AcceptableType,
        blocks: Tuple[Block, Block, Block],
    ) -> Move:
        """Build function for Move."""
        return cls(
            unit_vector=unit_vector,
            distance=np.float64(distance),
            max_speed=np.float64(max_speed),
            blocks=blocks,
        )

    def to_dict(self) -> Dict[str, Any]:
        """Return Move a dict."""
        return dataclasses.asdict(self)


@dataclasses.dataclass(frozen=True)
class MoveTarget:
    """Target coordinates and extrinsic constraint for the move."""

    position: Coordinates
    max_speed: np.float64

    @classmethod
    def build(cls, position: Coordinates, max_speed: AcceptableType) -> MoveTarget:
        """Build MoveTarget."""
        return cls(position=position, max_speed=np.float64(max_speed))


@dataclasses.dataclass(frozen=False)
class AxisConstraints:
    """Axis intrinsic constraints."""

    max_acceleration: np.float64
    max_speed_discont: np.float64
    max_direction_change_speed_discont: np.float64

    @classmethod
    def build(
        cls,
        max_acceleration: AcceptableType,
        max_speed_discont: AcceptableType,
        max_direction_change_speed_discont: AcceptableType,
    ) -> AxisConstraints:
        """Build AxisConstraints."""
        return cls(
            max_acceleration=np.float64(max_acceleration),
            max_speed_discont=np.float64(max_speed_discont),
            max_direction_change_speed_discont=np.float64(
                max_direction_change_speed_discont
            ),
        )


SystemConstraints = Dict[Axis, AxisConstraints]

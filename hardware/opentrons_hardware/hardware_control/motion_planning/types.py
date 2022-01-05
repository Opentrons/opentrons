"""Motion planning types."""
import enum
import dataclasses
import numpy as np
import numpy.typing as npt
from typing import Dict, Iterator, List, NamedTuple, OrderedDict, Tuple, Optional, Union


AcceptableType = Union[int, float, np.float64]


class Axis(enum.Enum):

    """Robot axis."""
    X = 0
    Y = 1
    Z = 2
    A = 3

    @classmethod
    def get_all_axes(cls) -> List["Axis"]:
        """Return all system axes of the robot."""
        return [cls.X, cls.Y, cls.Z, cls.A]


class Coordinates(NamedTuple):

    """Coordinates for all axes."""
    X: float
    Y: float
    Z: float
    A: float

    def to_dict(self) -> OrderedDict[Axis, float]:
        """Return Coordaintes as a dictionary."""
        return OrderedDict(zip(Axis.get_all_axes(), self))

    @classmethod
    def from_iter(cls, iter: Iterator[float]) -> "Coordinates":
        """Create coordinates from an iterator of floats."""
        return cls(*iter)

    def vectorize(self) -> npt.NDArray[float]:
        """Represent coordinates as a Numpy array."""
        return np.array(self)


@dataclasses.dataclass
class Block:
    """One of three groups that makes up a move."""

    distance: np.float64
    initial_speed: np.float64
    acceleration: np.float64

    def __init__(
        self,
        distance: AcceptableType,
        initial_speed: AcceptableType,
        acceleration: AcceptableType
    ):
        self.distance = np.float64(distance)
        self.initial_speed = np.float64(initial_speed)
        self.acceleration = np.float64(acceleration)

    @property
    def final_speed(self) -> np.float64:
        """Get final speed of the block."""
        return np.sqrt(  # type: ignore[no-any-return]
            self.initial_speed ** 2 + self.acceleration * self.distance * 2
        )

    @property
    def time(self) -> np.float64:
        """Get the time it takes for the block to complete its motion."""
        if self.acceleration:
            return (self.final_speed - self.initial_speed) / self.acceleration
        else:
            if not self.initial_speed:
                return np.float64(0.0)
            return self.distance / self.initial_speed


@dataclasses.dataclass(frozen=False)
class Move:
    """A trajectory between two coordinates."""

    distance: np.float64
    max_speed: np.float64
    blocks: Tuple[Block, Block, Block]
    unit_vector: Optional[Coordinates]

    @classmethod
    def build_dummy_move(cls) -> "Move":
        return cls(
            distance=np.float64(0),
            max_speed=np.float64(0),
            blocks=(
                Block(distance=0.0, initial_speed=0, acceleration=0),
                Block(distance=0, initial_speed=0, acceleration=0),
                Block(distance=0, initial_speed=0, acceleration=0),
            ),
            unit_vector=None,
        )
    
    @classmethod
    def build(cls, distance, max_speed, blocks, unit_vector) -> "Move":
        return cls(
            distance=np.float64(distance),
            max_speed=np.float64(max_speed),
            blocks=blocks,
            unit_vector=unit_vector
        )

    @property
    def initial_speed(self) -> np.float64:
        """Get initial speed of the move."""
        for block in self.blocks:
            if block.distance == 0:
                continue
            return block.initial_speed
        return np.float64(0.0)

    @property
    def final_speed(self) -> np.float64:
        """Get final speed of the move."""
        for block in reversed(self.blocks):
            if block.distance == 0:
                continue
        return block.final_speed

    @property
    def nonzero_blocks(self) -> int:
        """Get the number of non-zero blocks."""
        return len([b for b in self.blocks if b.time])


@dataclasses.dataclass(frozen=True)
class MoveTarget:
    """Target coordinates and extrinsic constraint for the move."""

    position: Coordinates
    max_speed: float


@dataclasses.dataclass(frozen=True)
class AxisConstraints:
    """Axis intrinsic constraints."""

    max_acceleration: float
    max_speed_discont: float
    max_direction_change_speed_discont: float


SystemConstraints = Dict[Axis, AxisConstraints]

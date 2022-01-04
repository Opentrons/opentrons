"""Motion planning types."""
import enum
import dataclasses
import numpy as np
import numpy.typing as npt
from typing import Dict, Iterator, List, NamedTuple, Tuple


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
    X: np.float64
    Y: np.float64
    Z: np.float64
    A: np.float64
    
    def __iter__(self):
        """Make Coordinates iterable."""
        look_up = self.to_dict()
        return iter(
            (axis, look_up[axis]) for axis in Axis.get_all_axes()
        )

    def to_dict(self) -> Dict[Axis, np.float64]:
        """Return Coordaintes as a dictionary."""
        return {
            Axis.X: self.X,
            Axis.Y: self.Y,
            Axis.Z: self.Z,
            Axis.A: self.A,
        }

    @classmethod
    def from_iter(cls, iter: Iterator[np.float64]) -> "Coordinates":
        """Create coordinates from an iterator of floats."""
        return cls(*iter)

    def vectorize(self) -> npt.NDArray[np.float64]:
        """Represent coordinates as a Numpy array."""
        return np.array(self)


class UnitVector(Coordinates):
    def __new__(cls, X: np.float64, Y: np.float64, Z: np.float64, A: np.float64):
        assert np.linalg.norm([X, Y, Z, A]) == 1.0, f"({X}, {Y}, {Z}, {A}) is not a unit vector"
        return super().__new__(cls, X, Y, Z, A)


@dataclasses.dataclass
class Block:
    """One of three groups that makes up a move."""

    distance: np.float64
    initial_speed: np.float64
    acceleration: np.float64

    @property
    def final_speed(self) -> np.float64:
        """Get final speed of the block."""
        return numpy.sqrt(
            self.initial_speed ** 2 + self.acceleration * self.distance * 2
        )

    @property
    def time(self) -> np.float64:
        """Get the time it takes for the block to complete its motion."""
        if self.acceleration:
            return (self.final_speed - self.initial_speed) / self.acceleration
        else:
            if not self.initial_speed:
                return 0
            return self.distance / self.initial_speed


@dataclasses.dataclass(frozen=True)
class Move:
    """A trajectory between two coordinates."""

    unit_vector: Coordinates
    distance: float
    max_speed: float
    blocks: Tuple[Block, Block, Block]

    @property
    def initial_speed(self) -> float:
        """Get initial speed of the move."""
        for block in self.blocks:
            if block.distance == 0:
                continue
            return block.initial_speed
        return 0

    @property
    def final_speed(self) -> float:
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

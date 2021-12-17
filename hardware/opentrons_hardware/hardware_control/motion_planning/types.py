"""Motion planning types."""
import enum
import dataclasses
import math
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

    X: float
    Y: float
    Z: float
    A: float

    @classmethod
    def from_iter(cls, iter: Iterator[float]) -> "Coordinates":
        """Create coordinates from an iterator of floats."""
        return cls(*iter)

    def vectorize(self) -> npt.NDArray[np.float64]:
        """Represent coordinates as a Numpy array."""
        return np.array(self)


@dataclasses.dataclass
class Block:
    """One of three groups that makes up a move."""

    distance: float
    initial_speed: float
    acceleration: float

    @property
    def final_speed(self) -> float:
        """Get final speed of the block."""
        return math.sqrt(
            self.initial_speed ** 2 + self.acceleration * self.distance * 2
        )

    @property
    def time(self) -> float:
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

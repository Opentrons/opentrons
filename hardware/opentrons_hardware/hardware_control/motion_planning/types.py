import enum
import dataclasses
import math
from typing import Dict, List, NamedTuple, Tuple

class Axis(enum.Enum):
    X = 0
    Y = 1
    Z = 2
    A = 3

    @classmethod
    def get_all_axes(cls) -> List["Axis"]:
        return [cls.X, cls.Y, cls.Z, cls.A]


class Coordinates(NamedTuple):
    X: float
    Y: float
    Z: float
    A: float


@dataclasses.dataclass
class Block:
    distance: float
    initial_speed: float
    acceleration: float
        
    @property
    def final_speed(self) -> float:
        return math.sqrt(self.initial_speed**2 + self.acceleration * self.distance * 2)
    
    @property
    def time(self) -> float:
        if self.acceleration:
            return (self.final_speed - self.initial_speed) / self.acceleration
        else:
            return self.distance / self.initial_speed


@dataclasses.dataclass(frozen=True)
class Move:
    unit_vector: Coordinates
    distance: float
    max_speed: float
    blocks: Tuple[Block, Block, Block]
        
    @property
    def initial_speed(self) -> float:
        for block in self.blocks:
            if block.distance == 0:
                continue
            return block.initial_speed
        return 0
    
    @property
    def final_speed(self) -> float:
        for block in reversed(self.blocks):
            if block.distance == 0:
                continue
        return block.final_speed
    
    @property
    def nonzero_blocks(self):
        return len([b for b in self.blocks if b.time])


@dataclasses.dataclass(frozen=True)
class Constraints:
    max_acceleration: float
    max_speed_discont: float
    max_direction_change_speed_discont: float


@dataclasses.dataclass(frozen=True)
class MoveTarget:
    position: Coordinates
    max_speed: float


@dataclasses.dataclass(frozen=True)
class AxisConstraints:
    max_acceleration: float
    max_speed_discont: float
    max_direction_change_speed_discont: float

SystemConstraints = Dict[Axis, AxisConstraints]

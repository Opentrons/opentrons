"""Motion planning types."""
from __future__ import annotations
import logging
import dataclasses
import numpy as np  # type: ignore[import]

from typing import (
    cast,
    Any,
    SupportsFloat,
    Dict,
    Iterator,
    OrderedDict,
    Tuple,
    Union,
    List,
)
from typing_extensions import Literal

log = logging.getLogger(__name__)

AcceptableType = Union[SupportsFloat, np.float64]

AxisNames = Literal["X", "Y", "Z", "A", "B", "C"]
AXIS_NAMES: List[AxisNames] = ["X", "Y", "Z", "A", "B", "C"]


@dataclasses.dataclass(frozen=False)
class Coordinates:
    """Coordinates for all axes."""

    X: np.float64
    Y: np.float64
    Z: np.float64
    A: np.float64
    B: np.float64
    C: np.float64

    def __init__(
        self,
        X: AcceptableType = 0,
        Y: AcceptableType = 0,
        Z: AcceptableType = 0,
        A: AcceptableType = 0,
        B: AcceptableType = 0,
        C: AcceptableType = 0,
    ) -> None:
        """Constructor."""
        self.X = np.float64(X)
        self.Y = np.float64(Y)
        self.Z = np.float64(Z)
        self.A = np.float64(A)
        self.B = np.float64(B)
        self.C = np.float64(C)

    def __iter__(self) -> Coordinates:
        """Return an iterator."""
        return self

    def __getitem__(self, key: AxisNames) -> np.float64:
        """Access axis coordinate value."""
        return self.to_dict()[key]

    def to_dict(self) -> OrderedDict[AxisNames, np.float64]:
        """Return Coordaintes as a dictionary."""
        vectorized = self.vectorize()
        return OrderedDict(zip(AXIS_NAMES, vectorized))

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


SystemConstraints = Dict[AxisNames, AxisConstraints]


class ZeroLengthMoveError(ValueError):
    """Error that handles trying to make a unit vector from a 0-length input.

    A unit vector would be undefined in this scenario, so this is the only safe way to
    handle it; but it's not usually a systemic error, sometimes something wants you to
    move to somewhere you already are. By using a special exception, we can specially
    catch it.
    """

    def __init__(self, origin: Coordinates, destination: Coordinates) -> None:
        """Build the exception with the data that caused it."""
        self._origin = origin
        self._destination = destination
        super().__init__()

    def __repr__(self) -> str:
        """Stringify."""
        return f"<{str(self)}>"

    def __str__(self) -> str:
        """Stringify."""
        return (
            f"{type(self)}: No distance between {self._origin} and {self._destination}"
        )

    @property
    def origin(self) -> Coordinates:
        """Get the origin."""
        return self._origin

    @property
    def destination(self) -> Coordinates:
        """Get the destination."""
        return self._destination

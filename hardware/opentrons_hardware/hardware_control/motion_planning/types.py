"""Motion planning types."""
from __future__ import annotations
import logging
import dataclasses
import numpy as np


from typing import (
    cast,
    Any,
    Dict,
    Tuple,
    TypeVar,
    Mapping,
    Generic,
    Iterable,
    Generator,
    Union,
    TYPE_CHECKING,
)

from opentrons_shared_data.errors.exceptions import MotionPlanningFailureError

if TYPE_CHECKING:
    from numpy.typing import NDArray

log = logging.getLogger(__name__)

CoordinateValue = TypeVar("CoordinateValue", Union[int, float], np.float64)
AxisKey = TypeVar("AxisKey")
Coordinates = Mapping[AxisKey, CoordinateValue]


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
        distance: CoordinateValue,
        initial_speed: CoordinateValue,
        acceleration: CoordinateValue,
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
            speed_squared = (
                self.initial_speed**2 + self.acceleration * self.distance * 2
            )
            if speed_squared < 0:
                # NOTE (AS, 2022-09-14): calculated value occasionally rounds to a negative,
                #                        like -1E-11, which should really just be zero
                log.warning(
                    f"Block encountered negative value in final_speed ({speed_squared}). "
                    f"Setting Block.final_speed to 0.0 instead."
                )
                return np.float64(0.0)
            return cast(np.float64, np.sqrt(speed_squared))

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


@dataclasses.dataclass
class Move(Generic[AxisKey]):
    """A trajectory between two coordinates."""

    unit_vector: Coordinates[AxisKey, np.float64]
    distance: np.float64
    max_speed: np.float64
    blocks: Tuple[Block, Block, Block]
    initial_speed: np.float64 = dataclasses.field(init=False)
    final_speed: np.float64 = dataclasses.field(init=False)
    nonzero_blocks: int = dataclasses.field(init=False)

    def __init__(
        self,
        unit_vector: Coordinates[AxisKey, np.float64],
        distance: np.float64,
        max_speed: np.float64,
        blocks: Tuple[Block, Block, Block],
    ) -> None:
        """Constructor."""
        # verify unit vector before creating Move
        if not is_unit_vector(unit_vector):
            raise MotionPlanningFailureError(
                f"Invalid unit vector: {unit_vector}",
                detail={
                    "unit_vector": str(unit_vector),
                    "distance": str(distance),
                    "max_speed": str(max_speed),
                },
            )
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
    def build_dummy(cls, for_axes: Iterable[AxisKey]) -> Move[AxisKey]:
        """Return a Move with dummy values."""

        def _dummy_unit_vector() -> Generator[np.float64, None, None]:
            yield np.float64(1.0)
            while True:
                yield np.float64(0.0)

        dummy_iterator = _dummy_unit_vector()

        def dummy_value() -> np.float64:
            return next(dummy_iterator)

        return Move(
            unit_vector={k: dummy_value() for k in for_axes},
            distance=np.float64(0),
            max_speed=np.float64(0),
            blocks=(
                Block(
                    distance=np.float64(0),
                    initial_speed=np.float64(0),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(0),
                    initial_speed=np.float64(0),
                    acceleration=np.float64(0),
                ),
                Block(
                    distance=np.float64(0),
                    initial_speed=np.float64(0),
                    acceleration=np.float64(0),
                ),
            ),
        )

    @classmethod
    def build(
        cls,
        unit_vector: Coordinates[AxisKey, CoordinateValue],
        distance: CoordinateValue,
        max_speed: CoordinateValue,
        blocks: Tuple[Block, Block, Block],
    ) -> Move[AxisKey]:
        """Build function for Move."""
        return cls(
            unit_vector={k: np.float64(v) for k, v in unit_vector.items()},
            distance=np.float64(distance),
            max_speed=np.float64(max_speed),
            blocks=blocks,
        )

    def to_dict(self) -> Dict[str, Any]:
        """Return Move a dict."""
        return dataclasses.asdict(self)


@dataclasses.dataclass(frozen=True)
class MoveTarget(Generic[AxisKey]):
    """Target coordinates and extrinsic constraint for the move."""

    position: Coordinates[AxisKey, np.float64]
    max_speed: np.float64

    @classmethod
    def build(
        cls, position: Coordinates[AxisKey, CoordinateValue], max_speed: CoordinateValue
    ) -> MoveTarget[AxisKey]:
        """Build MoveTarget."""
        return cls(
            position={k: np.float64(v) for k, v in position.items()},
            max_speed=np.float64(max_speed),
        )


@dataclasses.dataclass
class AxisConstraints:
    """Axis intrinsic constraints."""

    max_acceleration: np.float64
    max_speed_discont: np.float64
    max_direction_change_speed_discont: np.float64
    max_speed: np.float64

    @classmethod
    def build(
        cls,
        max_acceleration: CoordinateValue,
        max_speed_discont: CoordinateValue,
        max_direction_change_speed_discont: CoordinateValue,
        max_speed: CoordinateValue,
    ) -> AxisConstraints:
        """Build AxisConstraints."""
        return cls(
            max_acceleration=np.float64(max_acceleration),
            max_speed_discont=np.float64(max_speed_discont),
            max_direction_change_speed_discont=np.float64(
                max_direction_change_speed_discont
            ),
            max_speed=np.float64(max_speed),
        )


SystemConstraints = Dict[AxisKey, AxisConstraints]


class ZeroLengthMoveError(
    MotionPlanningFailureError, Generic[AxisKey, CoordinateValue]
):
    """Error that handles trying to make a unit vector from a 0-length input.

    A unit vector would be undefined in this scenario, so this is the only safe way to
    handle it; but it's not usually a systemic error, sometimes something wants you to
    move to somewhere you already are. By using a special exception, we can specially
    catch it.
    """

    def __init__(
        self,
        origin: Coordinates[AxisKey, CoordinateValue],
        destination: Coordinates[AxisKey, CoordinateValue],
    ) -> None:
        """Build the exception with the data that caused it."""
        self._origin: Coordinates[AxisKey, CoordinateValue] = origin
        self._destination: Coordinates[AxisKey, CoordinateValue] = destination
        super(MotionPlanningFailureError, self).__init__(
            message="Zero length move",
            detail={"origin": str(origin), "destination": str(destination)},
        )

    def __repr__(self) -> str:
        """Stringify."""
        return f"<{str(self)}>"

    def __str__(self) -> str:
        """Stringify."""
        return (
            f"{type(self)}: No distance between {self._origin} and {self._destination}"
        )

    @property
    def origin(self) -> Coordinates[AxisKey, CoordinateValue]:
        """Get the origin."""
        return self._origin

    @property
    def destination(self) -> Coordinates[AxisKey, CoordinateValue]:
        """Get the destination."""
        return self._destination


def vectorize(position: Coordinates[AxisKey, np.float64]) -> "NDArray[np.float64]":
    """Turn a coordinates map into a vector for math."""
    return np.array(list(position.values()))


def is_unit_vector(position: Coordinates[AxisKey, np.float64]) -> bool:
    """Check whether a coordinate vector has unit magnitude."""
    vectorized = vectorize(position)
    magnitude = np.linalg.norm(vectorized)  # type: ignore[no-untyped-call]
    return cast(bool, np.isclose(magnitude, 1.0))

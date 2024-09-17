from abc import abstractmethod, ABC
from typing import TypeVar, Optional

from opentrons.types import AxisMapType, Mount, Point


class AbstractRobot(ABC):
    @abstractmethod
    def get_pipette_type_from_engine(self, mount: Mount) -> Optional[str]:
        ...

    @abstractmethod
    def move_to(self, mount: Mount, destination: Point, speed: Optional[float]) -> None:
        ...

    @abstractmethod
    def move_axes_to(
        self, axis_map: AxisMapType, critical_point: AxisMapType, speed: Optional[float]
    ) -> None:
        ...

    @abstractmethod
    def move_axes_relative(self, axis_map: AxisMapType, speed: Optional[float]) -> None:
        ...

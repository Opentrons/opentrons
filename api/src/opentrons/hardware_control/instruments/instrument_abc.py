from abc import ABC, abstractmethod
from typing import Any, Optional, Generic, TypeVar, List, Tuple

from opentrons.types import Point
from opentrons.hardware_control.types import CriticalPoint


InstrumentConfig = TypeVar("InstrumentConfig")


class AbstractInstrument(ABC, Generic[InstrumentConfig]):
    """Defines the common methods of an instrument."""

    @property
    def model(self) -> str:
        """Return model of the instrument."""
        ...

    @property
    def config(self) -> InstrumentConfig:
        """Instrument config in dataclass format."""
        ...

    @abstractmethod
    def reload_configurations(self) -> None:
        """Reset the instrument to default configurations."""
        ...

    @abstractmethod
    def update_config_item(self, elem_name: str, elem_val: Any) -> None:
        """Update instrument config item."""
        ...

    @abstractmethod
    def critical_point(self, cp_override: Optional[CriticalPoint] = None) -> Point:
        """Computate critical point of an instrument."""
        ...


# TODO (lc 07-05-2023) Move this back to the combined Pipette object file.
def piecewise_volume_conversion(
    ul: float, sequence: List[Tuple[float, float, float]]
) -> float:
    """
    Takes a volume in microliters and a sequence representing a piecewise
    function for the slope and y-intercept of a ul/mm function, where each
    sub-list in the sequence contains:

      - the max volume for the piece of the function (minimum implied from the
        max of the previous item or 0
      - the slope of the segment
      - the y-intercept of the segment

    :return: the ul/mm value for the specified volume
    """
    # pick the first item from the seq for which the target is less than
    # the bracketing element
    for x in sequence:
        if ul <= x[0]:
            # use that element to calculate the movement distance in mm
            return x[1] * ul + x[2]

    # Compatibility with previous implementation of search.
    #  list(filter(lambda x: ul <= x[0], sequence))[0]
    raise IndexError()

from abc import ABC, abstractmethod
from typing import Any, Optional

from opentrons.types import Point
from .types import CriticalPoint


class AbstractInstrument(ABC):
    """Defines the common methods of an instrument."""

    @abstractmethod
    def update_config_item(self, elem_name: str, elem_val: Any) -> None:
        """Update instrument config item."""
        ...

    @abstractmethod
    def critical_point(self, cp_override: Optional[CriticalPoint] = None) -> Point:
        """Computate critical point of an instrument."""
        ...

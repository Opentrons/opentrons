from abc import ABC, abstractmethod
from typing import Any, Optional, Generic, TypeVar

from opentrons.types import Point, Mount
from opentrons.hardware_control.types import CriticalPoint, OT3Mount


InstrumentConfig = TypeVar("InstrumentConfig")
MountType = TypeVar("MountType", Mount, OT3Mount)


class AbstractInstrument(ABC, Generic[InstrumentConfig]):
    """Defines the common methods of an instrument."""

    @property
    def name(self) -> str:
        """Return name of the instrument."""
        ...

    @property
    def model(self) -> str:
        """Return model of the instrument."""
        ...

    @property
    def config(self) -> InstrumentConfig:
        """Instrument config in dataclass format."""
        ...

    @abstractmethod
    def update_config_item(self, elem_name: str, elem_val: Any) -> None:
        """Update instrument config item."""
        ...

    @abstractmethod
    def critical_point(self, cp_override: Optional[CriticalPoint] = None) -> Point:
        """Computate critical point of an instrument."""
        ...

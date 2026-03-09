from abc import ABC, abstractmethod
from typing import Any, Optional, Generic, TypeVar, Dict

from opentrons.types import Point
from opentrons.hardware_control.types import CriticalPoint


InstrumentConfig = TypeVar("InstrumentConfig")


class AbstractInstrument(ABC, Generic[InstrumentConfig]):
    """Defines the common methods of an instrument."""

    @property
    @abstractmethod
    def model(self) -> str:
        """Return model of the instrument."""
        ...

    @property
    @abstractmethod
    def config(self) -> InstrumentConfig:
        """Instrument config in dataclass format."""
        ...

    @abstractmethod
    def reload_configurations(self) -> None:
        """Reset the instrument to default configurations."""
        ...

    @abstractmethod
    def update_config_item(self, elements: Dict[str, Any]) -> None:
        """Update instrument config item."""
        ...

    @abstractmethod
    def critical_point(self, cp_override: Optional[CriticalPoint] = None) -> Point:
        """Computate critical point of an instrument."""
        ...

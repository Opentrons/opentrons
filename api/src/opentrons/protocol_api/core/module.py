"""Core module control interfaces."""
from abc import ABC, abstractmethod
from typing import Any, Generic, Optional, TypeVar

from opentrons.hardware_control.modules.types import (
    ModuleModel,
    ModuleType,
    TemperatureStatus,
)
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.types import DeckSlotName

from .labware import LabwareCoreType


class AbstractModuleCore(ABC, Generic[LabwareCoreType]):
    """Abstract core module control interface."""

    @property
    @abstractmethod
    def geometry(self) -> ModuleGeometry:
        """Get the module's geometry interface."""

    @abstractmethod
    def get_model(self) -> ModuleModel:
        """Get the module's model identifier."""

    @abstractmethod
    def get_type(self) -> ModuleType:
        """Get the module's general type identifier."""

    @abstractmethod
    def get_requested_model(self) -> ModuleModel:
        """Get the model identifier the module was requested as.

        This may differ from the actual model returned by `get_model`.
        """

    @abstractmethod
    def get_serial_number(self) -> str:
        """Get the module's unique hardware serial number."""

    @abstractmethod
    def get_deck_slot(self) -> DeckSlotName:
        """Get the module's deck slot."""


ModuleCoreType = TypeVar("ModuleCoreType", bound=AbstractModuleCore[Any])


class AbstractTemperatureModuleCore(AbstractModuleCore[LabwareCoreType]):
    """Core control interface for an attached Temperature Module."""

    @abstractmethod
    def set_target_temperature(self, celsius: float) -> None:
        """Set the temperature module's target temperature in °C."""

    @abstractmethod
    def wait_for_target_temperature(self, celsius: Optional[float] = None) -> None:
        """Wait until the module's target temperature is reached.

        Specifying a value for ``celsius`` that is different than
        the module's current target temperature may beahave unpredictably.
        """

    @abstractmethod
    def deactivate(self) -> None:
        """Deactivate the Temperature Module."""

    @abstractmethod
    def get_current_temperature(self) -> float:
        """Get the module's current temperature in °C."""

    @abstractmethod
    def get_target_temperature(self) -> Optional[float]:
        """Get the module's target temperature in °C, if set."""

    @abstractmethod
    def get_status(self) -> TemperatureStatus:
        """Get the module's current temperature status."""

"""Core module logic abstract interfaces."""
from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar

from opentrons.hardware_control.modules.types import ModuleModel
from .labware import LabwareCoreType


class AbstractModuleCore(ABC, Generic[LabwareCoreType]):
    """Abstract core module interface."""

    @abstractmethod
    def get_model(self) -> ModuleModel:
        """Get the module's model identifier."""

    @abstractmethod
    def get_serial_number(self) -> str:
        """Get the module's unique hardware serial number."""


ModuleCoreType = TypeVar("ModuleCoreType", bound=AbstractModuleCore[Any])

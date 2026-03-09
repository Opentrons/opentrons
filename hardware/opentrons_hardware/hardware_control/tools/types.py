"""tool types."""

from typing import Optional
from dataclasses import dataclass
from opentrons_hardware.firmware_bindings.constants import ToolType, PipetteName


@dataclass(frozen=True)
class ToolDetectionResult:
    """Model a tool detection result."""

    left: ToolType
    right: ToolType
    gripper: ToolType


@dataclass(frozen=True)
class BaseToolInformation:
    """Model the base information you can retrieve from any tool."""

    model: str
    serial: str


@dataclass(frozen=True)
class GripperInformation(BaseToolInformation):
    """Model the information you can retrieve from a gripper."""


@dataclass(frozen=True)
class HepaUVInformation(BaseToolInformation):
    """Model the information you can retrieve from a hepa/uv device."""


@dataclass(frozen=True)
class PipetteInformation(BaseToolInformation):
    """Model the information you can retrieve from a pipette."""

    name: PipetteName
    name_int: int


@dataclass(frozen=True)
class ToolSummary:
    """Model a full tool detection pass."""

    left: Optional[PipetteInformation]
    right: Optional[PipetteInformation]
    gripper: Optional[GripperInformation]

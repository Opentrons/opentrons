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
class PipetteInformation:
    """Model the information you can retrieve from a pipette."""

    name: PipetteName
    model: int
    serial: str


@dataclass(frozen=True)
class ToolSummary:
    """Model a full tool detection pass."""

    left: Optional[PipetteInformation]
    right: Optional[PipetteInformation]
    gripper: ToolType

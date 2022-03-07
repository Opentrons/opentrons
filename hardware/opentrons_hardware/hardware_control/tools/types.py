"""tool types."""

from dataclasses import dataclass
from opentrons_hardware.firmware_bindings.constants import ToolType


@dataclass(frozen=True)
class ToolDetectionResult:
    """Model a tool detection result."""

    left: ToolType
    right: ToolType
    gripper: ToolType

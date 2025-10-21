"""Stackup spec."""

from dataclasses import dataclass
from typing import Any, Literal


@dataclass(frozen=True)
class StackupSpec:
    """The test parameters of interest."""

    robot_type: Literal["OT-2"] | Literal["Flex"]
    module_load_name: str | None
    adapter_load_info: tuple[str, int] | None
    labware_load_info: tuple[str, int]

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "robot_type": self.robot_type,
            "module_load_name": self.module_load_name,
            "adapter_load_info": self.adapter_load_info,
            "labware_load_info": self.labware_load_info,
        }

    def stackup_key(self) -> str:
        """Generate a unique key for this stackup configuration."""
        module_name = self.module_load_name or "None"
        adapter_name = self.adapter_load_info[0] if self.adapter_load_info else "None"
        labware_name = self.labware_load_info[0]
        return f"{self.robot_type},{module_name},{adapter_name},{labware_name}"

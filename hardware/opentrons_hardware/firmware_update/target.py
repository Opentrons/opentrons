"""Firmware update target."""
from dataclasses import dataclass, field
from typing_extensions import Final

from opentrons_hardware.firmware_bindings import NodeId


BootloaderNodeIdMap: Final = {
    NodeId.head: NodeId.head_bootloader,
    NodeId.pipette_left: NodeId.pipette_left_bootloader,
    NodeId.pipette_right: NodeId.pipette_right_bootloader,
    NodeId.gantry_x: NodeId.gantry_x_bootloader,
    NodeId.gantry_y: NodeId.gantry_y_bootloader,
    NodeId.gripper: NodeId.gripper_bootloader,
}


@dataclass
class Target:
    """Pair of a sub-system's node id with its bootloader's node id."""

    system_node: NodeId
    bootloader_node: NodeId = field(init=False)

    def __post_init__(self) -> None:
        """Assign computed values."""
        bn = BootloaderNodeIdMap.get(self.system_node)
        assert bn, f"'{self.system_node}' is not valid for firmware update."
        self.bootloader_node = bn
